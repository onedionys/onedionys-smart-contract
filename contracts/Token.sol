// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 public initialSupply = 1_000_000 * 10 ** 18;
    uint256 public faucetAmount = 100 * 10 ** 18;
    uint256 public faucetLimit = 500_000 * 10 ** 18;
    uint256 public totalFaucetDistributed;

    mapping(address => uint256) public lastClaimTime;

    event FaucetClaimed(address indexed claimer, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed burner, uint256 amount);

    constructor() ERC20("Dion Token V1", "DNT1") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    function claimFaucet() external {
        require(totalFaucetDistributed + faucetAmount <= faucetLimit, "Faucet limit reached");

        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + 1 days,
            "You can only claim once every 24 hours"
        );

        address owner = owner();
        require(balanceOf(owner) >= faucetAmount, "Owner has insufficient tokens");

        _transfer(owner, msg.sender, faucetAmount);

        totalFaucetDistributed += faucetAmount;
        lastClaimTime[msg.sender] = block.timestamp;

        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        _burn(msg.sender, amount);

        emit TokensBurned(msg.sender, amount);
    }
}
