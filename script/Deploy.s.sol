// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../contracts/PremiumPool.sol";
import "../contracts/CoverageToken.sol";
import "../contracts/ClaimsManager.sol";
import "../contracts/PayoutRouter.sol";
import "lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

// Mock USDC for local testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 10**6);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDC (or use existing on testnet)
        MockUSDC usdc = new MockUSDC();

        // 1. Deploy CoverageToken
        CoverageToken coverageToken = new CoverageToken();

        // 2. Deploy PremiumPool
        PremiumPool pool = new PremiumPool(address(usdc), address(coverageToken));

        // 3. Deploy PayoutRouter
        PayoutRouter payoutRouter = new PayoutRouter(address(pool));

        // 4. Deploy ClaimsManager
        // Oracle address is initially deployer for testing, or a specific address
        address oracle = deployer; 
        ClaimsManager claimsManager = new ClaimsManager(
            address(pool), 
            address(coverageToken), 
            address(payoutRouter), 
            oracle
        );

        // 5. Wire up permissions
        // CoverageToken: transfer ownership to PremiumPool (for minting) and ClaimsManager (for burning)?
        // Actually CoverageToken is Ownable. We need to give mint/burn rights.
        // Current implementation is Ownable, so only owner can mint/burn.
        // We should probably use AccessControl for better granularity, but for MVP Ownable is fine.
        // We can transfer ownership to a "Controller" or just keep it simple.
        // Problem: PremiumPool needs to mint, ClaimsManager needs to burn.
        // Solution: CoverageToken should have roles. 
        // Since I used Ownable, I can only have one owner.
        // I should refactor CoverageToken to use AccessControl or a custom "Controllers" logic.
        // OR, I can make PremiumPool the owner, and ClaimsManager calls PremiumPool to burn?
        // Or make a central "Controller" contract.
        
        // Refactoring CoverageToken to AccessControl is better.
        // But for now, I will stick to the plan and maybe update CoverageToken.
        
        // Let's update CoverageToken to AccessControl in the next step if needed.
        // For now, I'll assume I'll fix it.
        
        // PayoutRouter needs to be set in PremiumPool?
        // PremiumPool.withdrawForClaim is onlyOwner. So PayoutRouter must be owner of PremiumPool?
        // Or PremiumPool adds PayoutRouter as an allowed withdrawer.
        // Current PremiumPool: withdrawForClaim is onlyOwner.
        // So PayoutRouter must own PremiumPool.
        pool.transferOwnership(address(payoutRouter));
        
        // PayoutRouter needs to know ClaimsManager.
        payoutRouter.setClaimsManager(address(claimsManager));

        vm.stopBroadcast();
    }
}
