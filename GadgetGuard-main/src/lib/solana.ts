import { AnchorProvider, BN, Program, type Idl } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { GADGETGUARD_IDL } from "./idl";
import { PROGRAM_ID, RPC_URL } from "./env";

export const connection = new Connection(RPC_URL, "confirmed");

export function getProgram(wallet: WalletContextState["wallet"] | null, publicKey: PublicKey | null): Program {
  if (!wallet || !publicKey) {
    throw new Error("Wallet not connected");
  }

  const provider = new AnchorProvider(
    connection,
    {
      publicKey,
      signAllTransactions: wallet.adapter.signAllTransactions?.bind(wallet.adapter),
      signTransaction: wallet.adapter.signTransaction?.bind(wallet.adapter),
    },
    { commitment: "confirmed" }
  );

  return new Program(GADGETGUARD_IDL as Idl, PROGRAM_ID, provider);
}

export function derivePoolPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("pool")], PROGRAM_ID);
}

export function derivePoolAuthorityPda(pool: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("pool_authority"), pool.toBuffer()], PROGRAM_ID);
}

export function deriveMemberPda(pool: PublicKey, member: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("member"), pool.toBuffer(), member.toBuffer()], PROGRAM_ID);
}

export function deriveClaimPda(pool: PublicKey, claimId: bigint): [PublicKey, number] {
  const seed = Buffer.alloc(8);
  seed.writeBigUInt64LE(claimId);
  return PublicKey.findProgramAddressSync([Buffer.from("claim"), pool.toBuffer(), seed], PROGRAM_ID);
}

export async function ensureAta(
  wallet: WalletContextState,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false
): Promise<{ ata: PublicKey; createdTx?: string }> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  const ata = getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const info = await connection.getAccountInfo(ata);

  if (info) {
    return { ata };
  }

  const ix = createAssociatedTokenAccountInstruction(
    wallet.publicKey,
    ata,
    owner,
    mint,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const sig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(sig, "confirmed");

  return { ata, createdTx: sig };
}

export function toClaimVariant(claimType: "damage" | "theft" | "loss") {
  if (claimType === "damage") return { damage: {} };
  if (claimType === "theft") return { theft: {} };
  return { loss: {} };
}

export function claimStatusLabel(status: unknown): "PENDING" | "APPROVED" | "REJECTED" | "PAID" {
  const value = status as Record<string, unknown>;
  if (value.paid !== undefined) return "PAID";
  if (value.approved !== undefined) return "APPROVED";
  if (value.rejected !== undefined) return "REJECTED";
  return "PENDING";
}

export { BN, TOKEN_PROGRAM_ID, SystemProgram };
