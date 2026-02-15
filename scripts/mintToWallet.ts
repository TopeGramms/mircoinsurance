import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  getConnection,
  getPayer,
  getMintAuthority,
  parsePublicKey,
  toBaseUnits,
  readMintAddressFromOutput,
} from "./common.js";

const DECIMALS = 6;

async function main() {
  const connection = getConnection();
  const payer = getPayer();
  const mintAuthority = getMintAuthority(payer);

  const mintAddress = process.argv[2] || process.env.TEST_MINT_ADDRESS || readMintAddressFromOutput();
  if (!mintAddress) {
    throw new Error("Missing mint address. Pass as arg, set TEST_MINT_ADDRESS, or run createTestMint.ts first.");
  }

  const recipientAddress = process.argv[3] || process.env.TARGET_WALLET;
  if (!recipientAddress) {
    throw new Error("Missing recipient wallet. Pass wallet address as arg or set TARGET_WALLET.");
  }

  const amountUi = process.argv[4] || process.env.MINT_AMOUNT || "1000";
  const amount = toBaseUnits(amountUi, DECIMALS);

  const mint = parsePublicKey(mintAddress, "mint address");
  const recipient = parsePublicKey(recipientAddress, "recipient wallet");

  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    recipient,
    false,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID
  );

  const signature = await mintTo(
    connection,
    payer,
    mint,
    recipientAta.address,
    mintAuthority,
    amount,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );

  console.log(`Minted ${amountUi} tokens to ${recipient.toBase58()}`);
  console.log(`Recipient ATA: ${recipientAta.address.toBase58()}`);
  console.log(`Signature: ${signature}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
