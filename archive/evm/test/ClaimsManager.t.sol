// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/ClaimsManager.sol";
import "../contracts/PremiumPool.sol";
import "../contracts/CoverageToken.sol";
import "../contracts/PayoutRouter.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") { _mint(msg.sender, 1000000 * 10**6); }
    function decimals() public view virtual override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract ClaimsManagerTest is Test {
    ClaimsManager claimsManager;
    PremiumPool pool;
    CoverageToken token;
    PayoutRouter router;
    MockUSDC usdc;
    address user = address(1);
    address oracle = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        token = new CoverageToken();
        pool = new PremiumPool(address(usdc), address(token));
        router = new PayoutRouter(address(pool));
        claimsManager = new ClaimsManager(address(pool), address(token), address(router), oracle);

        // Setup permissions
        // 1. Token ownership to pool for minting (initial)
        token.transferOwnership(address(pool));
        
        // 2. Pool ownership to Router for withdrawing
        pool.transferOwnership(address(router));
        
        // 3. Router knows ClaimsManager
        router.setClaimsManager(address(claimsManager));
        
        // 4. We need ClaimsManager to be able to burn tokens.
        // Issue: Token is owned by Pool. ClaimsManager cannot burn.
        // We need to fix CoverageToken to AccessControl.
        
        usdc.mint(user, 1000 * 10**6);
        vm.prank(user);
        usdc.approve(address(pool), 1000 * 10**6);
    }

    function testSubmitClaim() public {
        // User pays 2 months to be eligible
        vm.startPrank(user);
        pool.payPremium(2);
        
        claimsManager.submitClaim("Phone", "Broken screen", 100 * 10**6);
        vm.stopPrank();
        
        (uint256 id, address claimant, , , , , ) = claimsManager.claims(0);
        assertEq(id, 0);
        assertEq(claimant, user);
    }
}
