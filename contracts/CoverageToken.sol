// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title CoverageToken
 * @notice Non-transferable token representing insurance coverage months.
 * @dev Minted by PremiumPool, burned by ClaimsManager.
 */
contract CoverageToken is ERC20, Ownable {
    error TransferNotAllowed();

    constructor() ERC20("MicroInsurance Coverage", "CVG") Ownable(msg.sender) {}

    /**
     * @notice Mints coverage tokens to a user.
     * @param to The user receiving coverage.
     * @param amount The amount of months (tokens) to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns coverage tokens from a user (e.g., upon claim payout or expiration).
     * @param from The user whose coverage is being burned.
     * @param amount The amount of tokens to burn.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Overrides transfer to make token non-transferable (Soulbound-like).
     * Only allows minting and burning.
     */
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }
        super._update(from, to, value);
    }
}
