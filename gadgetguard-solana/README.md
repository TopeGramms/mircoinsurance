# GadgetGuard Solana

> Decentralized freelancer protection pool on Solana - built with Anchor and Next.js

GadgetGuard Solana is a community-driven protection pool where freelancers can insure their devices against damage, theft, and loss. Members deposit tokens, vote on claims, and receive payouts through transparent on-chain governance.

## 🌟 Features

- **Pool-based Protection**: Members contribute to a shared pool
- **Democratic Voting**: Claims are approved by member votes
- **Transparent Payouts**: Automatic on-chain payouts for approved claims
- **SPL Token Support**: Uses USDC or custom test tokens
- **Minimal UI**: Clean, finance-grade interface with transaction transparency

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Solana CLI** (v1.18.x or later)
  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  ```

- **Anchor CLI** (v0.30.x or later)
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
  avm install latest
  avm use latest
  ```

- **Rust** (latest stable)
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- **Node.js** (v18.x or later)
  ```bash
  # Download from https://nodejs.org/
  ```

- **Yarn** (recommended)
  ```bash
  npm install -g yarn
  ```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd gadgetguard-solana
yarn install  # Install test dependencies
```

### 2. Configure Solana

```bash
# Set Solana to devnet
solana config set --url devnet

# Create a new wallet (or use existing)
solana-keygen new

# Airdrop SOL for testing
solana airdrop 2
```

### 3. Build the Program

```bash
# Build Anchor program
anchor build

# Get program ID
anchor keys list
# Copy the program ID and update it in:
# - Anchor.toml (under [programs.devnet])
# - lib.rs (declare_id! macro)
# - app/.env.example
```

### 4. Run Tests

```bash
# Run Anchor tests
anchor test

# Or run tests without rebuild
anchor test --skip-build
```

### 5. Deploy to Devnet

```bash
# Deploy program
anchor deploy --provider.cluster devnet

# Note the deployed program ID
```

### 6. Initialize Pool (CLI)

```bash
# You'll need to call initialize_pool from CLI or tests
# Example using Anchor CLI:
anchor run initialize-pool  # (requires adding script to package.json)
```

### 7. Run Frontend

```bash
cd app

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values:
# NEXT_PUBLIC_PROGRAM_ID=<your_deployed_program_id>
# NEXT_PUBLIC_POOL_ADDRESS=<pool_pda>  # Derive using anchor-client
# NEXT_PUBLIC_MINT_ADDRESS=<token_mint>  # Your test mint or Devnet USDC

# Install dependencies
yarn install

# Run development server
yarn dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
gadgetguard-solana/
├── programs/
│   └── gadgetguard/
│       └── src/
│           ├── lib.rs          # Main program with 7 instructions
│           ├── state.rs        # Account structures (Pool, Member, Claim)
│           └── errors.rs       # Custom error codes
├── tests/
│   └── gadgetguard.ts         # Comprehensive test suite
├── app/                       # Next.js frontend
│   ├── app/
│   │   ├── page.tsx          # Overview page
│   │   ├── pool/page.tsx     # My Coverage
│   │   ├── actions/page.tsx  # Deposit/Withdraw
│   │   ├── claims/page.tsx   # Claims Feed
│   │   └── submit-claim/page.tsx
│   ├── components/
│   │   ├── WalletContextProvider.tsx
│   │   ├── WalletButton.tsx
│   │   └── Navigation.tsx
│   ├── lib/
│   │   ├── config.ts         # Network config
│   │   └── anchor-client.ts  # PDA helpers
│   └── package.json
├── Anchor.toml               # Anchor config
├── Cargo.toml               # Rust workspace
└── README.md
```

## 🔧 Program Instructions

The Anchor program implements 7 core instructions:

1. **initialize_pool**: Create a new protection pool (admin only)
2. **join_pool**: Join as a new member
3. **deposit**: Deposit tokens to increase coverage
4. **withdraw**: Withdraw tokens (reduces coverage)
5. **submit_claim**: Submit a new claim with evidence
6. **vote_claim**: Vote YES/NO on a pending claim
7. **finalize_claim**: Execute payout after voting window

### PDA Seeds

- Pool: `["pool"]`
- Pool Authority: `["pool_authority", pool_pubkey]`
- Member: `["member", pool_pubkey, member_pubkey]`
- Claim: `["claim", pool_pubkey, claim_id_bytes]`

## 🎨 Frontend Pages

1. **Overview** (`/`) - Pool statistics and recent claims
2. **My Coverage** (`/pool`) - Your deposit and claim limit
3. **Deposit/Withdraw** (`/actions`) - Manage pool balance
4. **Claims Feed** (`/claims`) - Vote on active claims
5. **Submit Claim** (`/submit-claim`) - Request payout

## ⚙️ Configuration

### Pool Governance Parameters

Set during `initialize_pool`:

- **max_claim_pct**: Maximum claim as % of deposit (default: 5000 = 50%)
- **vote_window_secs**: Voting period in seconds (default: 86400 = 24 hours)
- **quorum**: Minimum votes required (default: 2)
- **approval_ratio**: Approval threshold in basis points (default: 6000 = 60%)

### Environment Variables

Create `app/.env.local`:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
NEXT_PUBLIC_POOL_ADDRESS=<your_pool_pda>
NEXT_PUBLIC_MINT_ADDRESS=<your_token_mint>
```

## 🧪 Testing

The test suite covers:

- ✅ Pool initialization
- ✅ Member joining and deposits
- ✅ Claim submission and voting
- ✅ Double-vote prevention
- ✅ Claim approval and payout
- ✅ Claim rejection
- ✅ Token withdrawals

Run with:

```bash
anchor test
```

## 🔐 Security Considerations

**⚠️ This is an MVP for educational purposes**

Before production use:

- [ ] Add comprehensive access controls
- [ ] Implement cooldown periods for withdrawals
- [ ] Add slashing for fraudulent claims
- [ ] Implement claim appeal mechanism
- [ ] Add emergency pause functionality
- [ ] Conduct professional security audit
- [ ] Add time-weighted voting (reputation)
- [ ] Implement stake-based governance

## 📝 Development Notes

### Creating a Test Token

```bash
# Use spl-token CLI
spl-token create-token
spl-token create-account <TOKEN_ADDRESS>
spl-token mint <TOKEN_ADDRESS> 1000
```

### Deriving PDAs

PDAs can be derived using the helper functions in `app/lib/anchor-client.ts`:

```typescript
import { derivePoolPda, deriveMemberPda, deriveClaimPda } from '@/lib/anchor-client';

const poolPda = derivePoolPda();
const memberPda = deriveMemberPda(poolPda, memberKey);
const claimPda = deriveClaimPda(poolPda, claimId);
```

### Working with the IDL

After building:

```bash
# IDL is generated at:
target/idl/gadgetguard.json

# Copy to frontend for use:
cp target/idl/gadgetguard.json app/lib/idl.json
```

Update `app/lib/anchor-client.ts` to import the IDL.

## 🐛 Troubleshooting

### Anchor build fails

- Ensure Rust is up to date: `rustup update`
- Check Anchor version: `anchor --version`
- Clean build: `anchor clean && anchor build`

### Transaction fails with "Insufficient funds"

- Check pool vault has enough tokens
- Verify member's claim limit
- Ensure vote window hasn't expired

### Frontend shows "Cannot read properties of undefined"

- Verify environment variables in `.env.local`
- Check that program is deployed and addresses are correct
- Ensure wallet is connected

## 🤝 Contributing

This is an open-source MVP. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Program](https://spl.solana.com/token)

## 📧 Support

For issues and questions:

- Open a GitHub issue
- Join Solana Discord: https://discord.gg/solana

---

**Built with ❤️ on Solana**
