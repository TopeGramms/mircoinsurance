import type { Idl } from "@coral-xyz/anchor";

export const GADGETGUARD_IDL: Idl = {
  version: "0.1.0",
  name: "gadgetguard",
  instructions: [
    {
      name: "initializePool",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "acceptedMint", isMut: false, isSigner: false },
        { name: "admin", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "maxClaimPct", type: "u16" },
        { name: "voteWindowSecs", type: "i64" },
        { name: "quorum", type: "u8" },
        { name: "approvalRatio", type: "u16" }
      ]
    },
    {
      name: "joinPool",
      accounts: [
        { name: "member", isMut: true, isSigner: false },
        { name: "pool", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "deposit",
      accounts: [
        { name: "member", isMut: true, isSigner: false },
        { name: "pool", isMut: true, isSigner: false },
        { name: "memberTokenAccount", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "poolAuthority", isMut: false, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "amount", type: "u64" }]
    },
    {
      name: "withdraw",
      accounts: [
        { name: "member", isMut: true, isSigner: false },
        { name: "pool", isMut: true, isSigner: false },
        { name: "memberTokenAccount", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "poolAuthority", isMut: false, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "amount", type: "u64" }]
    },
    {
      name: "submitClaim",
      accounts: [
        { name: "claim", isMut: true, isSigner: false },
        { name: "member", isMut: false, isSigner: false },
        { name: "pool", isMut: true, isSigner: false },
        { name: "poolVault", isMut: false, isSigner: false },
        { name: "poolAuthority", isMut: false, isSigner: false },
        { name: "user", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "claimType", type: { defined: "ClaimType" } },
        { name: "requestedAmount", type: "u64" },
        { name: "evidenceUri", type: "string" }
      ]
    },
    {
      name: "voteClaim",
      accounts: [
        { name: "claim", isMut: true, isSigner: false },
        { name: "member", isMut: false, isSigner: false },
        { name: "pool", isMut: false, isSigner: false },
        { name: "user", isMut: false, isSigner: true }
      ],
      args: [{ name: "voteYes", type: "bool" }]
    },
    {
      name: "finalizeClaim",
      accounts: [
        { name: "claim", isMut: true, isSigner: false },
        { name: "pool", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "claimantTokenAccount", isMut: true, isSigner: false },
        { name: "poolAuthority", isMut: false, isSigner: false },
        { name: "claimant", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "pool",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "acceptedMint", type: "publicKey" },
          { name: "totalDeposits", type: "u64" },
          { name: "totalPaidOut", type: "u64" },
          { name: "claimCount", type: "u64" },
          { name: "memberCount", type: "u64" },
          { name: "maxClaimPct", type: "u16" },
          { name: "voteWindowSecs", type: "i64" },
          { name: "quorum", type: "u8" },
          { name: "approvalRatio", type: "u16" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "member",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "member", type: "publicKey" },
          { name: "depositedAmount", type: "u64" },
          { name: "claimLimit", type: "u64" },
          { name: "lastClaimTs", type: "i64" },
          { name: "active", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "claim",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "claimId", type: "u64" },
          { name: "claimant", type: "publicKey" },
          { name: "claimType", type: { defined: "ClaimType" } },
          { name: "requestedAmount", type: "u64" },
          { name: "evidenceUri", type: "string" },
          { name: "createdTs", type: "i64" },
          { name: "status", type: { defined: "ClaimStatus" } },
          { name: "yesVotes", type: "u8" },
          { name: "noVotes", type: "u8" },
          { name: "voters", type: { vec: "publicKey" } },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  types: [
    {
      name: "ClaimType",
      type: {
        kind: "enum",
        variants: [{ name: "damage" }, { name: "theft" }, { name: "loss" }]
      }
    },
    {
      name: "ClaimStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "pending" },
          { name: "approved" },
          { name: "rejected" },
          { name: "paid" }
        ]
      }
    }
  ],
  events: [],
  errors: []
};
