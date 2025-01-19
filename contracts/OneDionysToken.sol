// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract OneDionysToken is ERC20, Ownable {
    uint256 public faucetAmount = 100 * 10 ** 18; // Number of tokens that can be claimed on the faucet (example: 100 ODT)
    mapping(address => uint256) public lastClaimTime; // Last time claimed for each address

    // Initial supply set at the time of contract deployment
    uint256 public initialSupply = 100000000 * 10 ** 18; // 100 million ODT as initial sample supply

    constructor() ERC20('One Dionys Token', 'ODT') Ownable(msg.sender) {
        // Mint initial supply to contract owner's address
        _mint(msg.sender, initialSupply);
    }

    // Function to mint tokens to a specific address (faucet)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Function for claim faucet (ODT)
    function claimFaucet() external {
        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + 1 days,
            'You can only claim once every 24 hours'
        );

        // Mint the ODT token to the address that claims the faucet
        _mint(msg.sender, faucetAmount);

        // Update last claim time
        lastClaimTime[msg.sender] = block.timestamp;
    }

    // Function for burn token
    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, 'Insufficient balance to burn');
        _burn(msg.sender, amount);
    }
}
