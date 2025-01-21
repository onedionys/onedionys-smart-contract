// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract OneDionysToken is ERC20, Ownable {
    uint256 public initialSupply = 1_000_000_000 * 10 ** 18;
    uint256 public faucetAmount = 100 * 10 ** 18;
    uint256 public faucetLimit = 500_000_000 * 10 ** 18;
    uint256 public totalFaucetDistributed;

    mapping(address => uint256) public lastClaimTime;

    constructor() ERC20('One Dionys Token', 'ODT') Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function claimFaucet() external {
        require(totalFaucetDistributed + faucetAmount <= faucetLimit, 'Faucet limit reached');

        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + 1 days,
            'You can only claim once every 24 hours'
        );

        _mint(msg.sender, faucetAmount);

        totalFaucetDistributed += faucetAmount;

        address owner = owner();
        uint256 burnAmount = faucetAmount * 2;
        require(balanceOf(owner) >= burnAmount, 'Owner has insufficient tokens to burn');
        _burn(owner, burnAmount);

        lastClaimTime[msg.sender] = block.timestamp;
    }

    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, 'Insufficient balance to burn');
        _burn(msg.sender, amount);
    }
}
