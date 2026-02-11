// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./PremiumPool.sol";

/**
 * @title PayoutRouter
 * @notice Handles the execution of payouts.
 */
contract PayoutRouter is Ownable {
    PremiumPool public pool;
    address public claimsManager;

    event PayoutCompleted(address indexed user, uint256 amount);

    constructor(address _pool) Ownable(msg.sender) {
        pool = PremiumPool(_pool);
    }

    function setClaimsManager(address _claimsManager) external onlyOwner {
        claimsManager = _claimsManager;
    }

    /**
     * @notice Executes a payout to a user.
     * @dev Only callable by ClaimsManager.
     */
    function executePayout(address to, uint256 amount) external {
        require(msg.sender == claimsManager, "Only ClaimsManager");
        
        // Trigger withdrawal from pool
        pool.withdrawForClaim(to, amount);
        
        emit PayoutCompleted(to, amount);
    }
}
