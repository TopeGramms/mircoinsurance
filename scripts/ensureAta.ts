import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { getConnection, getPayer, parsePublicKey, readMintAddressFromOutput } from "./common.js";

async function main() {
  const connection = getConnection();
  const payer = getPayer();

  const mintAddress = process.argv[2] || process.env.TEST_MINT_ADDRESS || readMintAddressFromOutput();
  if (!mintAddress) {
    throw new Error("Missing mint address. Pass as arg, set TEST_MINT_ADDRESS, or run createTestMint.ts first.");
  }

  const walletAddress = process.argv[3] || process.env.TARGET_WALLET || payer.publicKey.toBase58();
  const mint = parsePublicKey(mintAddress, "mint address");
  const wallet = parsePublicKey(walletAddress, "wallet address");

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    wallet,
    false,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID
  );

  console.log(`ATA: ${ata.address.toBase58()}`);
  console.log(`Wallet: ${wallet.toBase58()}`);
  console.log(`Mint: ${mint.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
