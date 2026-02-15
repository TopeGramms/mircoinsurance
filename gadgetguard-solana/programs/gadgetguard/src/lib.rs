use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

pub mod errors;
pub mod state;

use errors::ErrorCode;
use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gadgetguard {
    use super::*;

    /// Initialize a new protection pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        max_claim_pct: u16,
        vote_window_secs: i64,
        quorum: u8,
        approval_ratio: u16,
    ) -> Result<()> {
        require!(
            max_claim_pct <= 10000 && vote_window_secs > 0 && quorum > 0 && approval_ratio <= 10000,
            ErrorCode::InvalidGovernanceConfig
        );

        let pool = &mut ctx.accounts.pool;
        
        pool.admin = ctx.accounts.admin.key();
        pool.accepted_mint = ctx.accounts.accepted_mint.key();
        pool.total_deposits = 0;
        pool.total_paid_out = 0;
        pool.claim_count = 0;
        pool.member_count = 0;
        pool.max_claim_pct = max_claim_pct;
        pool.vote_window_secs = vote_window_secs;
        pool.quorum = quorum;
        pool.approval_ratio = approval_ratio;
        pool.bump = ctx.bumps.pool;
        
        msg!("Pool initialized by admin: {}", ctx.accounts.admin.key());
        msg!("Max claim %: {}, Quorum: {}, Approval ratio: {}", max_claim_pct, quorum, approval_ratio);
        
        Ok(())
    }

    /// Join the pool as a new member
    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let pool = &mut ctx.accounts.pool;
        
        member.pool = ctx.accounts.pool.key();
        member.member = ctx.accounts.user.key();
        member.deposited_amount = 0;
        member.claim_limit = 0;
        member.last_claim_ts = 0;
        member.active = true;
        member.bump = ctx.bumps.member;
        
        pool.member_count = pool.member_count.checked_add(1).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("Member {} joined pool", ctx.accounts.user.key());
        
        Ok(())
    }

    /// Deposit tokens into the pool
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let pool = &mut ctx.accounts.pool;
        
        require!(member.active, ErrorCode::MemberNotActive);
        
        // Transfer tokens from member to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.member_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update member and pool state
        member.deposited_amount = member.deposited_amount.checked_add(amount).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Calculate claim limit: deposit * max_claim_pct / 10000
        let claim_limit_increase = (amount as u128)
            .checked_mul(pool.max_claim_pct as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::ArithmeticOverflow)? as u64;
        
        member.claim_limit = member.claim_limit.checked_add(claim_limit_increase).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        pool.total_deposits = pool.total_deposits.checked_add(amount).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("Member {} deposited {} tokens, new claim limit: {}", 
            ctx.accounts.user.key(), amount, member.claim_limit);
        
        Ok(())
    }

    /// Withdraw tokens from the pool
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let member = &mut ctx.accounts.member;
        let pool = &mut ctx.accounts.pool;
        
        require!(member.active, ErrorCode::MemberNotActive);
        require!(member.deposited_amount >= amount, ErrorCode::InsufficientMemberDeposit);
        require!(ctx.accounts.pool_vault.amount >= amount, ErrorCode::InsufficientPoolFunds);
        
        // For MVP: simple withdrawal, no cooldown check or pending claim check
        // (In production, you'd check for pending claims)
        
        // Transfer tokens from pool vault to member
        let seeds = &[
            b"pool_authority",
            pool.key().as_ref(),
            &[ctx.bumps.pool_authority],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.member_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;
        
        // Update member and pool state
        member.deposited_amount = member.deposited_amount.checked_sub(amount).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        // Reduce claim limit proportionally
        let claim_limit_decrease = (amount as u128)
            .checked_mul(pool.max_claim_pct as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::ArithmeticOverflow)? as u64;
        
        member.claim_limit = member.claim_limit.saturating_sub(claim_limit_decrease);
        
        pool.total_deposits = pool.total_deposits.checked_sub(amount).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("Member {} withdrew {} tokens", ctx.accounts.user.key(), amount);
        
        Ok(())
    }

    /// Submit a new claim
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        claim_type: ClaimType,
        requested_amount: u64,
        evidence_uri: String,
    ) -> Result<()> {
        let member = &ctx.accounts.member;
        let pool = &mut ctx.accounts.pool;
        let claim = &mut ctx.accounts.claim;
        
        require!(member.active, ErrorCode::MemberNotActive);
        require!(requested_amount <= member.claim_limit, ErrorCode::ClaimExceedsLimit);
        require!(evidence_uri.len() <= 200, ErrorCode::EvidenceUriTooLong);
        
        // Check pool has enough funds
        let available_funds = ctx.accounts.pool_vault.amount;
        require!(available_funds >= requested_amount, ErrorCode::InsufficientPoolFunds);
        
        let clock = Clock::get()?;
        let claim_id = pool.claim_count;
        
        claim.pool = ctx.accounts.pool.key();
        claim.claim_id = claim_id;
        claim.claimant = ctx.accounts.user.key();
        claim.claim_type = claim_type;
        claim.requested_amount = requested_amount;
        claim.evidence_uri = evidence_uri;
        claim.created_ts = clock.unix_timestamp;
        claim.status = ClaimStatus::Pending;
        claim.yes_votes = 0;
        claim.no_votes = 0;
        claim.voters = Vec::new();
        claim.bump = ctx.bumps.claim;
        
        pool.claim_count = pool.claim_count.checked_add(1).ok_or(ErrorCode::ArithmeticOverflow)?;
        
        msg!("Claim {} submitted by {} for {} tokens", claim_id, ctx.accounts.user.key(), requested_amount);
        
        Ok(())
    }

    /// Vote on a claim
    pub fn vote_claim(ctx: Context<VoteClaim>, vote_yes: bool) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let member = &ctx.accounts.member;
        let pool = &ctx.accounts.pool;
        
        require!(member.active, ErrorCode::MemberNotActive);
        require!(claim.status == ClaimStatus::Pending, ErrorCode::ClaimNotPending);
        
        // Check vote window hasn't expired
        let clock = Clock::get()?;
        let vote_deadline = claim.created_ts.checked_add(pool.vote_window_secs).ok_or(ErrorCode::ArithmeticOverflow)?;
        require!(clock.unix_timestamp <= vote_deadline, ErrorCode::VoteWindowExpired);
        
        // Check member hasn't already voted
        let voter_key = ctx.accounts.user.key();
        require!(!claim.voters.contains(&voter_key), ErrorCode::AlreadyVoted);
        
        // Add voter and record vote
        require!(claim.voters.len() < 32, ErrorCode::MaxVotersReached);
        claim.voters.push(voter_key);
        
        if vote_yes {
            claim.yes_votes = claim.yes_votes.checked_add(1).ok_or(ErrorCode::ArithmeticOverflow)?;
            msg!("Member {} voted YES on claim {}", voter_key, claim.claim_id);
        } else {
            claim.no_votes = claim.no_votes.checked_add(1).ok_or(ErrorCode::ArithmeticOverflow)?;
            msg!("Member {} voted NO on claim {}", voter_key, claim.claim_id);
        }
        
        Ok(())
    }

    /// Finalize a claim after voting window
    pub fn finalize_claim(ctx: Context<FinalizeClaim>) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let pool = &mut ctx.accounts.pool;
        
        require!(claim.status == ClaimStatus::Pending, ErrorCode::ClaimNotPending);
        require!(ctx.accounts.claimant.key() == claim.claimant, ErrorCode::InvalidClaimant);
        
        // Check vote window has expired
        let clock = Clock::get()?;
        let vote_deadline = claim.created_ts.checked_add(pool.vote_window_secs).ok_or(ErrorCode::ArithmeticOverflow)?;
        require!(clock.unix_timestamp > vote_deadline, ErrorCode::VoteWindowNotExpired);
        
        // Check quorum
        let total_votes = claim.yes_votes.checked_add(claim.no_votes).ok_or(ErrorCode::ArithmeticOverflow)?;
        require!(total_votes >= pool.quorum, ErrorCode::QuorumNotReached);
        
        // Calculate approval ratio: yes_votes / total_votes (in basis points)
        let approval = ((claim.yes_votes as u128)
            .checked_mul(10000)
            .ok_or(ErrorCode::ArithmeticOverflow)?)
            .checked_div(total_votes as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)? as u16;
        
        if approval >= pool.approval_ratio {
            // Claim approved - pay out
            claim.status = ClaimStatus::Approved;
            require!(
                ctx.accounts.pool_vault.amount >= claim.requested_amount,
                ErrorCode::InsufficientPoolFunds
            );
            
            // Transfer tokens to claimant
            let seeds = &[
                b"pool_authority",
                pool.key().as_ref(),
                &[ctx.bumps.pool_authority],
            ];
            let signer = &[&seeds[..]];
            
            let cpi_accounts = Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.claimant_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, claim.requested_amount)?;
            
            claim.status = ClaimStatus::Paid;
            pool.total_paid_out = pool.total_paid_out.checked_add(claim.requested_amount).ok_or(ErrorCode::ArithmeticOverflow)?;
            
            msg!("Claim {} APPROVED and PAID {} tokens to {}", 
                claim.claim_id, claim.requested_amount, claim.claimant);
        } else {
            // Claim rejected
            claim.status = ClaimStatus::Rejected;
            msg!("Claim {} REJECTED - approval ratio {} < required {}", 
                claim.claim_id, approval, pool.approval_ratio);
        }
        
        Ok(())
    }
}

// ============ CONTEXTS ============

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = admin,
        space = Pool::LEN,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,
    
    pub accepted_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(
        init,
        payer = user,
        space = Member::LEN,
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = user
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = pool_authority
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    /// CHECK: PDA authority for pool vault
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = user
    )]
    pub member_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = pool_authority
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    /// CHECK: PDA authority for pool vault
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(
        init,
        payer = user,
        space = Claim::LEN,
        seeds = [b"claim", pool.key().as_ref(), pool.claim_count.to_le_bytes().as_ref()],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = pool_authority
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    /// CHECK: PDA authority for pool vault
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteClaim<'info> {
    #[account(
        mut,
        seeds = [b"claim", pool.key().as_ref(), claim.claim_id.to_le_bytes().as_ref()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(
        seeds = [b"member", pool.key().as_ref(), user.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,
    
    #[account(
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeClaim<'info> {
    #[account(
        mut,
        seeds = [b"claim", pool.key().as_ref(), claim.claim_id.to_le_bytes().as_ref()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = pool_authority
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = pool.accepted_mint,
        associated_token::authority = claimant
    )]
    pub claimant_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: PDA authority for pool vault
    #[account(
        seeds = [b"pool_authority", pool.key().as_ref()],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,
    
    /// CHECK: Claimant address from claim account
    #[account(
        constraint = claimant.key() == claim.claimant @ ErrorCode::InvalidClaimant
    )]
    pub claimant: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}
