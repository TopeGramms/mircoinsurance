import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  getConnection,
  getPayer,
  getMintAuthority,
  parsePublicKey,
  toBaseUnits,
  writeMintOutput,
  RPC_URL,
} from "./common.js";

const DECIMALS = 6;

async function main() {
  const connection = getConnection();
  const payer = getPayer();
  const mintAuthority = getMintAuthority(payer);

  const recipientArg = process.argv[2] || process.env.TEST_MINT_RECIPIENT;
  const recipient = recipientArg
    ? parsePublicKey(recipientArg, "test mint recipient")
    : payer.publicKey;

  const initialSupplyUi = process.argv[3] || process.env.TEST_MINT_INITIAL_SUPPLY || "100000";
  const initialSupply = toBaseUnits(initialSupplyUi, DECIMALS);

  const mint = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    DECIMALS,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );

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
    initialSupply,
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );

  writeMintOutput({
    mint: mint.toBase58(),
    decimals: DECIMALS,
    rpcUrl: RPC_URL,
    mintAuthority: mintAuthority.publicKey.toBase58(),
    initialRecipient: recipient.toBase58(),
    initialRecipientAta: recipientAta.address.toBase58(),
    initialSupplyUi,
    createdAt: new Date().toISOString(),
    mintToSignature: signature,
  });

  console.log(`Mint: ${mint.toBase58()}`);
  console.log(`Recipient ATA: ${recipientAta.address.toBase58()}`);
  console.log(`Initial supply: ${initialSupplyUi}`);
  console.log(`Mint tx: ${signature}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
