import { PublicKey, clusterApiUrl } from "@solana/web3.js";

export const RPC_URL = import.meta.env.VITE_RPC_URL || clusterApiUrl("devnet");
export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);
export const POOL_ADDRESS = import.meta.env.VITE_POOL_ADDRESS
  ? new PublicKey(import.meta.env.VITE_POOL_ADDRESS)
  : null;
export const TEST_MINT_ADDRESS = import.meta.env.VITE_TEST_MINT_ADDRESS
  ? new PublicKey(import.meta.env.VITE_TEST_MINT_ADDRESS)
  : null;
export const TEST_MINT_DECIMALS = Number(import.meta.env.VITE_TEST_MINT_DECIMALS || "6");
export const VOTE_WINDOW_SECS = Number(import.meta.env.VITE_VOTE_WINDOW_SECS || "60");

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerUrl(signatureOrAddress: string, type: "tx" | "address" = "tx"): string {
  return `${EXPLORER_BASE}/${type}/${signatureOrAddress}?cluster=devnet`;
}

export function formatTokenAmount(amount: bigint | number): string {
  const units = typeof amount === "number" ? BigInt(amount) : amount;
  const whole = units / BigInt(10 ** TEST_MINT_DECIMALS);
  const fraction = (units % BigInt(10 ** TEST_MINT_DECIMALS)).toString().padStart(TEST_MINT_DECIMALS, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fraction}`;
}

export function parseUiAmount(input: string): bigint {
  if (!/^\d+(\.\d+)?$/.test(input)) {
    throw new Error("Enter a valid positive amount");
  }
  const [whole, fraction = ""] = input.split(".");
  const base = `${whole}${fraction.padEnd(TEST_MINT_DECIMALS, "0")}`;
  return BigInt(base);
}
