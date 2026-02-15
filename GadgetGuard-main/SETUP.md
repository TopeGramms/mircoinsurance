# GadgetGuard Frontend Setup

## 1. Prepare test mint (repo root)

```bash
cd scripts
npm install
npm run create-mint
```

This writes:
- `scripts/output/mint.json`
- `GadgetGuard-main/public/mint.json`

## 2. Configure frontend

```bash
cd ../GadgetGuard-main
cp .env.example .env
```

Set `VITE_PROGRAM_ID` and (optional) `VITE_POOL_ADDRESS`.

## 3. Start app

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and run:
- Join pool
- Deposit
- Submit claim
- Vote
- Finalize
