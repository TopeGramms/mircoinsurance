require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const { assessRisk } = require('./riskRules');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuration
const PROVIDER_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Oracle private key
const CLAIMS_MANAGER_ADDRESS = process.env.CLAIMS_MANAGER_ADDRESS;
const PREMIUM_POOL_ADDRESS = process.env.PREMIUM_POOL_ADDRESS;

// ABI snippets
const CLAIMS_MANAGER_ABI = [
    "function processClaim(uint256 claimId, bool approve) external",
    "event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 estimatedCost)"
];

const PREMIUM_POOL_ABI = [
    "function userStatus(address user) external view returns (uint256 lastPaymentTimestamp, uint256 monthsPaidStreak)"
];

async function startOracle() {
    if (!PRIVATE_KEY) {
        console.warn("No PRIVATE_KEY found. Oracle running in read-only/mock mode.");
    }

    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : null;

    const claimsManager = new ethers.Contract(CLAIMS_MANAGER_ADDRESS, CLAIMS_MANAGER_ABI, wallet || provider);
    const premiumPool = new ethers.Contract(PREMIUM_POOL_ADDRESS, PREMIUM_POOL_ABI, provider);

    console.log("Oracle listening for ClaimSubmitted events...");

    try {
        claimsManager.on("ClaimSubmitted", async (claimId, claimant, estimatedCost) => {
            console.log(`New Claim Detected: ID ${claimId} from ${claimant}`);

            try {
                // 1. Fetch user data from PremiumPool
                const status = await premiumPool.userStatus(claimant);
                const streak = Number(status.monthsPaidStreak);

                // 2. Assess Risk
                const claimData = { estimatedCost: Number(estimatedCost) };
                const isApproved = assessRisk(claimData, streak);

                // 3. Submit decision on-chain
                if (wallet) {
                    console.log(`Submitting decision: ${isApproved} for claim ${claimId}`);
                    const tx = await claimsManager.processClaim(claimId, isApproved);
                    await tx.wait();
                    console.log(`Decision confirmed: ${tx.hash}`);
                } else {
                    console.log(`[Mock] Would submit decision: ${isApproved}`);
                }

            } catch (error) {
                console.error("Error processing claim:", error);
            }
        });
    } catch (error) {
        console.error("Error setting up event listener (this is expected for mock mode):", error.message);
    }
}

// Endpoint to manually trigger check (for testing)
app.post('/check-claim', async (req, res) => {
    const { claimId, claimant, estimatedCost } = req.body;
    // Logic similar to event listener...
    res.send({ status: 'Processing started' });
});

app.listen(PORT, () => {
    console.log(`Oracle Engine running on port ${PORT}`);
    startOracle().catch(console.error);
});
