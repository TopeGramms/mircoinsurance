// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./PremiumPool.sol";
import "./CoverageToken.sol";
import "./PayoutRouter.sol";

/**
 * @title ClaimsManager
 * @notice Manages claim submission and validation.
 */
contract ClaimsManager is Ownable {
    PremiumPool public pool;
    CoverageToken public coverageToken;
    PayoutRouter public payoutRouter;
    address public oracle;

    struct Claim {
        uint256 id;
        address claimant;
        string deviceType;
        string description;
        uint256 estimatedCost;
        bool processed;
        bool approved;
    }

    uint256 public nextClaimId;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256) public lastClaimTimestamp;

    uint256 public constant COOLDOWN_PERIOD = 30 days;

    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 estimatedCost);
    event ClaimProcessed(uint256 indexed claimId, bool approved);

    constructor(
        address _pool,
        address _coverageToken,
        address _payoutRouter,
        address _oracle
    ) Ownable(msg.sender) {
        pool = PremiumPool(_pool);
        coverageToken = CoverageToken(_coverageToken);
        payoutRouter = PayoutRouter(_payoutRouter);
        oracle = _oracle;
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    /**
     * @notice Submit a new claim.
     */
    function submitClaim(string calldata deviceType, string calldata description, uint256 estimatedCost) external {
        require(pool.isEligible(msg.sender), "User not eligible");
        require(block.timestamp >= lastClaimTimestamp[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        
        // Burn 1 month of coverage (1 token) upon claim submission (or approval? Requirements say burn on payout, but usually burn on use)
        // Requirement: "Burn credits on claim payout." -> We will burn in processClaim.
        
        claims[nextClaimId] = Claim({
            id: nextClaimId,
            claimant: msg.sender,
            deviceType: deviceType,
            description: description,
            estimatedCost: estimatedCost,
            processed: false,
            approved: false
        });

        emit ClaimSubmitted(nextClaimId, msg.sender, estimatedCost);
        nextClaimId++;
    }

    /**
     * @notice Process a claim (called by Oracle).
     */
    function processClaim(uint256 claimId, bool approve) external {
        require(msg.sender == oracle, "Only Oracle");
        Claim storage claim = claims[claimId];
        require(!claim.processed, "Already processed");

        claim.processed = true;
        claim.approved = approve;

        if (approve) {
            // Burn 1 token (1 month coverage)
            // Assuming 1 token = 1 * 10^18
            coverageToken.burn(claim.claimant, 1 * 10**18);
            
            // Trigger payout
            payoutRouter.executePayout(claim.claimant, claim.estimatedCost);
            
            // Update cooldown
            lastClaimTimestamp[claim.claimant] = block.timestamp;
        }

        emit ClaimProcessed(claimId, approve);
    }
}
