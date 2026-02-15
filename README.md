# GadgetGuard Devnet MVP (Solana)

GadgetGuard is a decentralized freelancer/device protection pool on Solana Devnet.

This repo is now Solana-first:
- Anchor program: `gadgetguard-solana/`
- Frontend: `GadgetGuard-main/`
- Utility scripts: `scripts/`
- Legacy EVM history: `archive/evm/`

## What Works

Happy path on Devnet with a custom 6-decimal SPL test mint:
1. Connect wallet
2. Join pool
3. Get test tokens
4. Deposit
5. Submit claim
6. Vote
7. Finalize
8. Payout

## Repo Layout

- `gadgetguard-solana/`: Anchor program (pool/member/claim state + instructions)
- `GadgetGuard-main/`: Vite React Solana frontend (wallet adapter + Anchor client)
- `scripts/`: Node TypeScript scripts (`airdropSol.ts`, `createTestMint.ts`, `mintToWallet.ts`, `ensureAta.ts`)
- `scripts/output/mint.json`: mint metadata output (also synced to `GadgetGuard-main/public/mint.json`)
- `archive/evm/`: archived Base/EVM contracts/tests/scripts

## Quick Start (No Heavy Solana Toolchain)

This path does not require local Solana CLI + Anchor install.

### 1. Configure env

Copy `.env.example` to `.env` at repo root and set:
- `RPC_URL` (Devnet)
- `WALLET_KEYPAIR_PATH` (JSON keypair path used by scripts)

Copy `GadgetGuard-main/.env.example` to `GadgetGuard-main/.env` and set:
- `VITE_RPC_URL`
- `VITE_PROGRAM_ID` (Devnet deployed program)
- `VITE_POOL_ADDRESS` (optional; defaults to PDA seed `pool`)
- `VITE_TEST_MINT_ADDRESS` (optional if `/public/mint.json` exists)

### 2. Create test mint + fund wallet

From `scripts/`:

```bash
npm install
npm run airdrop
npm run create-mint
npm run mint-to -- <MINT_ADDRESS> <WALLET_ADDRESS> 1000
```

Notes:
- `create-mint` writes `scripts/output/mint.json`.
- Mint output is mirrored to `GadgetGuard-main/public/mint.json` for frontend auto-read.

### 3. Run frontend

From `GadgetGuard-main/`:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Optional: Deploy Your Own Program (Anchor)

If you want your own program deployment, use `gadgetguard-solana/` with Anchor and update:
- `gadgetguard-solana/programs/gadgetguard/src/lib.rs` `declare_id!`
- `gadgetguard-solana/Anchor.toml` `[programs.devnet]`
- `GadgetGuard-main/.env` `VITE_PROGRAM_ID`

## Frontend Flows

- Overview: TVL, members, paid out, claim list, explorer links
- Actions: Join, Deposit, Withdraw, Get Test Tokens command
- Claims Feed: list claims, vote yes/no, finalize after vote window
- Submit Claim: strict validation + evidence URL

Deposit flow in UI:
1. Ensure user ATA exists
2. Ensure pool vault ATA exists (pool authority PDA)
3. Token transfer is executed by the on-chain `deposit` instruction
4. `deposit` records member/pool accounting
5. UI refreshes balances + claim limit

## Scripts

- `scripts/airdropSol.ts`: airdrop SOL to payer or target wallet
- `scripts/createTestMint.ts`: create 6-decimal mint + initial supply
- `scripts/mintToWallet.ts`: mint tokens to any wallet ATA
- `scripts/ensureAta.ts`: create ATA if missing

All scripts read from `.env`.

## Security / Hygiene

- Secrets and local artifacts are gitignored (`.env*`, keypairs, `node_modules`, build outputs)
- No dependency on Devnet USDC: custom SPL test mint only
- `archive/evm` kept intact as historical reference

## Legacy EVM

All EVM/Foundry instructions are moved under `archive/evm/README.md`.
