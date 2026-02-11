use anchor_lang::prelude::*;

/// Pool account - stores pool configuration and statistics
#[account]
pub struct Pool {
    /// Admin who can initialize and manage the pool
    pub admin: Pubkey,
    /// SPL token mint accepted for deposits (e.g., USDC)
    pub accepted_mint: Pubkey,
    /// Total amount deposited across all members
    pub total_deposits: u64,
    /// Total amount paid out in approved claims
    pub total_paid_out: u64,
    /// Number of claims submitted
    pub claim_count: u64,
    /// Number of active members
    pub member_count: u64,
    /// Maximum claim percentage (basis points, e.g., 5000 = 50%)
    pub max_claim_pct: u16,
    /// Voting window duration in seconds
    pub vote_window_secs: i64,
    /// Minimum number of votes required for quorum
    pub quorum: u8,
    /// Approval ratio required (basis points, e.g., 6000 = 60%)
    pub approval_ratio: u16,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Pool {
    /// Size of Pool account in bytes
    pub const LEN: usize = 8 + // discriminator
        32 + // admin
        32 + // accepted_mint
        8 + // total_deposits
        8 + // total_paid_out
        8 + // claim_count
        8 + // member_count
        2 + // max_claim_pct
        8 + // vote_window_secs
        1 + // quorum
        2 + // approval_ratio
        1; // bump
}

/// Member account - tracks individual member participation
#[account]
pub struct Member {
    /// Pool this member belongs to
    pub pool: Pubkey,
    /// Member's wallet address
    pub member: Pubkey,
    /// Total amount deposited by this member
    pub deposited_amount: u64,
    /// Maximum claim amount this member can request
    pub claim_limit: u64,
    /// Timestamp of last claim submission
    pub last_claim_ts: i64,
    /// Whether member is active
    pub active: bool,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Member {
    /// Size of Member account in bytes
    pub const LEN: usize = 8 + // discriminator
        32 + // pool
        32 + // member
        8 + // deposited_amount
        8 + // claim_limit
        8 + // last_claim_ts
        1 + // active
        1; // bump
}

/// Claim type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ClaimType {
    Damage,
    Theft,
    Loss,
}

/// Claim status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Paid,
}

/// Claim account - represents a submitted claim with voting data
#[account]
pub struct Claim {
    /// Pool this claim belongs to
    pub pool: Pubkey,
    /// Unique claim ID within the pool
    pub claim_id: u64,
    /// Member who submitted the claim
    pub claimant: Pubkey,
    /// Type of claim (damage, theft, loss)
    pub claim_type: ClaimType,
    /// Amount requested (in tokens)
    pub requested_amount: u64,
    /// URI to evidence/documentation (max 200 chars)
    pub evidence_uri: String,
    /// Timestamp when claim was created
    pub created_ts: i64,
    /// Current status of the claim
    pub status: ClaimStatus,
    /// Number of YES votes
    pub yes_votes: u8,
    /// Number of NO votes
    pub no_votes: u8,
    /// List of voters (pubkeys) to prevent double voting (max 32 voters for MVP)
    pub voters: Vec<Pubkey>,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl Claim {
    /// Size of Claim account in bytes (with max voters and evidence URI)
    pub const LEN: usize = 8 + // discriminator
        32 + // pool
        8 + // claim_id
        32 + // claimant
        1 + // claim_type
        8 + // requested_amount
        4 + 200 + // evidence_uri (string with length prefix, max 200 chars)
        8 + // created_ts
        1 + // status
        1 + // yes_votes
        1 + // no_votes
        4 + (32 * 32) + // voters (vec with length prefix, max 32 voters)
        1; // bump
}
