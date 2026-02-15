# GadgetGuard Frontend (Solana Devnet)

Minimal Vite React frontend for the GadgetGuard Solana MVP.

## Features

- Wallet connect (Phantom/Solflare)
- Overview metrics + explorer links
- Join / Deposit / Withdraw
- Claims feed: vote + finalize
- Submit claim with validation
- Test-token UX command using root scripts

## Env

Copy `.env.example` to `.env` and set:

```env
VITE_RPC_URL=https://api.devnet.solana.com
VITE_PROGRAM_ID=<DEVNET_PROGRAM_ID>
VITE_POOL_ADDRESS=<POOL_PDA_OR_EMPTY>
VITE_TEST_MINT_ADDRESS=<TEST_MINT_OR_EMPTY>
VITE_TEST_MINT_DECIMALS=6
VITE_VOTE_WINDOW_SECS=60
```

If `VITE_TEST_MINT_ADDRESS` is empty, app tries `public/mint.json`.

## Run

```bash
npm install
npm run dev
```

## Notes

- Devnet only
- Uses custom test SPL mint (not Devnet USDC)
- Pool PDA defaults to seed `pool`
