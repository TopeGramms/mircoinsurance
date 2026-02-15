// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./CoverageToken.sol";

/**
 * @title PremiumPool
 * @notice Handles premium payments and holds funds.
 */
contract PremiumPool is Ownable {
    IERC20 public immutable usdc;
    CoverageToken public immutable coverageToken;
    
    uint256 public constant MONTHLY_PREMIUM = 10 * 10**6; // 10 USDC (assuming 6 decimals)
    uint256 public constant MIN_MONTHS_FOR_CLAIM = 2;

    struct UserStatus {
        uint256 lastPaymentTimestamp;
        uint256 monthsPaidStreak;
    }

    mapping(address => UserStatus) public userStatus;

    event PremiumPaid(address indexed user, uint256 amount, uint256 months);
    event UserEligible(address indexed user);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdc, address _coverageToken) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        coverageToken = CoverageToken(_coverageToken);
    }

    /**
     * @notice Pay premium for X months.
     * @param months Number of months to pay for.
     */
    function payPremium(uint256 months) external {
        require(months > 0, "Must pay for at least 1 month");
        uint256 amount = months * MONTHLY_PREMIUM;
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        UserStatus storage status = userStatus[msg.sender];
        
        // Simple streak logic: if paid within last 35 days, increment streak, else reset
        // For MVP, we just increment streak for simplicity of testing
        status.monthsPaidStreak += months;
        status.lastPaymentTimestamp = block.timestamp;

        // Mint coverage tokens
        // We need to call the CoverageToken contract. 
        // Note: PremiumPool must be owner or have role to mint.
        coverageToken.mint(msg.sender, months * 10**18); // Assuming 18 decimals for coverage token

        emit PremiumPaid(msg.sender, amount, months);

        if (status.monthsPaidStreak >= MIN_MONTHS_FOR_CLAIM) {
            emit UserEligible(msg.sender);
        }
    }

    /**
     * @notice Allows PayoutRouter (or owner) to withdraw funds for claims.
     * @param to Recipient of funds (user).
     * @param amount Amount to transfer.
     */
    function withdrawForClaim(address to, uint256 amount) external onlyOwner {
        require(usdc.transfer(to, amount), "Transfer failed");
        emit FundsWithdrawn(to, amount);
    }
    
    /**
     * @notice View function to check eligibility.
     */
    function isEligible(address user) external view returns (bool) {
        return userStatus[user].monthsPaidStreak >= MIN_MONTHS_FOR_CLAIM;
    }
}
