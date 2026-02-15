# Archived EVM / Base MVP

This folder preserves the previous EVM implementation.

## Contents

- `contracts/`: Solidity contracts
- `test/`: Foundry tests
- `script/`: Foundry deploy scripts
- `oracle-engine/`: Node oracle service
- `foundry.toml`: Foundry configuration

## Historical Setup (EVM)

```bash
forge install
forge test
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
```

This archive is read-only history. Active development is Solana Devnet in repo root (`gadgetguard-solana`, `GadgetGuard-main`, `scripts`).
