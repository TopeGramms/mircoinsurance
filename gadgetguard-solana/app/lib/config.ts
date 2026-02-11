import { PublicKey, clusterApiUrl } from "@solana/web3.js";

export const NETWORK = "devnet";
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

// Deployed program ID
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || 'DicTcBsK197EqTAZmxa6QbxnrKV5ntmGtSfGoHPdthVi'
);

export const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS
    ? new PublicKey(process.env.NEXT_PUBLIC_POOL_ADDRESS)
    : null;

export const MINT_ADDRESS = process.env.NEXT_PUBLIC_MINT_ADDRESS
    ? new PublicKey(process.env.NEXT_PUBLIC_MINT_ADDRESS)
    : null;

export const EXPLORER_URL = "https://explorer.solana.com";

export function getExplorerUrl(signature: string, type: "tx" | "address" = "tx"): string {
    const path = type === "tx" ? "tx" : "address";
    return `${EXPLORER_URL}/${path}/${signature}?cluster=${NETWORK}`;
}

// Pool governance parameters (for display)
export const POOL_CONFIG = {
    maxClaimPct: 50, // 50%
    voteWindowHours: 24, // 24 hours
    quorum: 2, // minimum 2 votes
    approvalRatio: 60, // 60%
};
