# Devnet Utility Scripts

Scripts use `@solana/web3.js` + `@solana/spl-token` and read from root `.env`.

## Commands

```bash
npm run airdrop
npm run create-mint
npm run mint-to -- <MINT_ADDRESS> <WALLET_ADDRESS> <AMOUNT_UI>
npm run ensure-ata -- <MINT_ADDRESS> <WALLET_ADDRESS>
```

## Output

`create-mint` writes:
- `scripts/output/mint.json`
- `GadgetGuard-main/public/mint.json`
