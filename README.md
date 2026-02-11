
# Crypto Micro-Insurance MVP

This project is a micro-insurance protocol on Base L2, protecting user devices with monthly premiums.

## Architecture

### Smart Contracts (`/contracts`)
- **PremiumPool.sol**: Handles premium payments (USDC) and tracks user streaks.
- **CoverageToken.sol**: Non-transferable ERC20 token representing coverage months.
- **ClaimsManager.sol**: Manages claim submission and Oracle validation.
- **PayoutRouter.sol**: Executes payouts to users.

### Oracle Engine (`/oracle-engine`)
- Node.js service listening for `ClaimSubmitted` events.
- Validates eligibility (2+ months payment streak).
- Submits approval/rejection on-chain.

### Backend API (`/backend-api`)
- Express.js server with SQLite.
- Provides endpoints for user dashboards and claim history.

## Setup

### Prerequisites
- Foundry (Forge)
- Node.js & npm

### Installation
1. Install dependencies:
   ```bash
   forge install
   cd oracle-engine && npm install
   cd ../backend-api && npm install
   ```

2. Configure Environment:
   - Create `.env` in root and subfolders with `PRIVATE_KEY`, `RPC_URL`, etc.

### Testing
- Run smart contract tests:
  ```bash
  forge test
  ```

### Deployment
- Deploy to Base Sepolia (or local):
  ```bash
  forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
  ```
