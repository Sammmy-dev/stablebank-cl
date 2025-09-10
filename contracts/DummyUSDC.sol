// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DummyUSDC
 * @dev A dummy USDC contract for testing purposes
 * This contract mimics USDC behavior with 6 decimals
 */
contract DummyUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    
    constructor(address initialOwner) 
        ERC20("Dummy USDC", "dUSDC") 
        Ownable(initialOwner)
    {
        // Mint initial supply to owner (1,000,000 USDC)
        _mint(initialOwner, 1000000 * 10**DECIMALS);
    }
    
    /**
     * @dev Override decimals to return 6 (like real USDC)
     */
    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Mint tokens to a specific address (only owner)
     * @param to The address to mint tokens to
     * @param amount The amount to mint (in smallest units)
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function mintBatch(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Get the total supply in USDC units (with 6 decimals)
     */
    function getTotalSupplyUSDC() public view returns (uint256) {
        return totalSupply() / 10**DECIMALS;
    }
    
    /**
     * @dev Get balance in USDC units for a specific address
     * @param account The address to check
     */
    function getBalanceUSDC(address account) public view returns (uint256) {
        return balanceOf(account) / 10**DECIMALS;
    }
} 