import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getConnection, getPayer, parsePublicKey } from "./common.js";

async function main() {
  const connection = getConnection();
  const payer = getPayer();
  const walletArg = process.argv[2];
  const solArg = process.argv[3];

  const recipient = walletArg
    ? parsePublicKey(walletArg, "recipient wallet")
    : payer.publicKey;

  const solAmount = solArg || process.env.AIRDROP_SOL || "2";
  const lamports = Math.floor(Number(solAmount) * LAMPORTS_PER_SOL);
  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error(`Invalid airdrop amount: ${solAmount}`);
  }

  const signature = await connection.requestAirdrop(recipient, lamports);
  const latest = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature,
      ...latest,
    },
    "confirmed"
  );

  console.log(`Airdropped ${solAmount} SOL to ${recipient.toBase58()}`);
  console.log(`Signature: ${signature}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
