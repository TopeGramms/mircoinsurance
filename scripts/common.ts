import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

const rootEnv = path.resolve(process.cwd(), "..", ".env");
const localEnv = path.resolve(process.cwd(), ".env");
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
}
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv, override: true });
}

export const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export function loadKeypairFromFile(filePath: string): Keypair {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), "..", filePath);
  const raw = fs.readFileSync(resolved, "utf8");
  const secret = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secret);
}

export function getPayer(): Keypair {
  const keypairPath = process.env.WALLET_KEYPAIR_PATH;
  if (!keypairPath) {
    throw new Error("Missing WALLET_KEYPAIR_PATH in .env");
  }
  return loadKeypairFromFile(keypairPath);
}

export function getMintAuthority(defaultAuthority: Keypair): Keypair {
  const authorityPath = process.env.MINT_AUTHORITY_KEYPAIR_PATH;
  return authorityPath ? loadKeypairFromFile(authorityPath) : defaultAuthority;
}

export function parsePublicKey(value: string, label: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

export function toBaseUnits(amountUi: string | number, decimals: number): bigint {
  const value = typeof amountUi === "number" ? amountUi.toString() : amountUi;
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid amount: ${value}`);
  }
  const [whole, frac = ""] = value.split(".");
  const padded = `${whole}${frac.padEnd(decimals, "0")}`;
  const normalized = padded.replace(/^0+/, "") || "0";
  return BigInt(normalized);
}

export function writeMintOutput(payload: Record<string, unknown>): void {
  const outDir = path.resolve(process.cwd(), "output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.resolve(outDir, "mint.json");
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const frontendPublic = path.resolve(process.cwd(), "..", "GadgetGuard-main", "public");
  if (fs.existsSync(frontendPublic)) {
    const frontendOut = path.resolve(frontendPublic, "mint.json");
    fs.writeFileSync(frontendOut, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

export function readMintAddressFromOutput(): string | null {
  const outFile = path.resolve(process.cwd(), "output", "mint.json");
  if (!fs.existsSync(outFile)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(outFile, "utf8"));
  return typeof parsed.mint === "string" ? parsed.mint : null;
}
