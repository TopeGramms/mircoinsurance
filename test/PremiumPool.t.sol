// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../contracts/PremiumPool.sol";
import "../contracts/CoverageToken.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10**6);
    }
    function decimals() public view virtual override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract PremiumPoolTest is Test {
    PremiumPool pool;
    CoverageToken token;
    MockUSDC usdc;
    address user = address(1);

    function setUp() public {
        usdc = new MockUSDC();
        token = new CoverageToken();
        pool = new PremiumPool(address(usdc), address(token));
        
        // Setup permissions (Fixing the Ownable issue mentioned in deploy script)
        // For this test, we keep test contract as owner of token to mint/burn?
        // PremiumPool needs to mint.
        token.transferOwnership(address(pool));
        
        usdc.mint(user, 1000 * 10**6);
        vm.prank(user);
        usdc.approve(address(pool), 1000 * 10**6);
    }

    function testPayPremium() public {
        vm.prank(user);
        pool.payPremium(1);
        
        (uint256 lastPayment, uint256 streak) = pool.userStatus(user);
        assertEq(streak, 1);
        assertEq(token.balanceOf(user), 1 * 10**18);
    }

    function testEligibility() public {
        vm.startPrank(user);
        pool.payPremium(2);
        vm.stopPrank();
        
        assertTrue(pool.isEligible(user));
    }
}
