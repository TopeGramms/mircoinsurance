use anchor_lang::prelude::*;

/// Custom error codes for the GadgetGuard program
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in pool vault")]
    InsufficientPoolFunds,
    
    #[msg("Requested claim amount exceeds member's claim limit")]
    ClaimExceedsLimit,
    
    #[msg("Member has already voted on this claim")]
    AlreadyVoted,
    
    #[msg("Vote window has not expired yet")]
    VoteWindowNotExpired,
    
    #[msg("Vote window has expired")]
    VoteWindowExpired,
    
    #[msg("Claim is not in pending status")]
    ClaimNotPending,
    
    #[msg("Member is not active in the pool")]
    MemberNotActive,
    
    #[msg("Insufficient member deposit for withdrawal")]
    InsufficientMemberDeposit,
    
    #[msg("Member has pending claims, cannot withdraw")]
    PendingClaimsExist,
    
    #[msg("Invalid claim type")]
    InvalidClaimType,
    
    #[msg("Evidence URI too long (max 200 chars)")]
    EvidenceUriTooLong,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Quorum not reached")]
    QuorumNotReached,
    
    #[msg("Maximum voters reached for this claim")]
    MaxVotersReached,

    #[msg("Invalid governance configuration")]
    InvalidGovernanceConfig,

    #[msg("Claimant account does not match claim")]
    InvalidClaimant,
}
