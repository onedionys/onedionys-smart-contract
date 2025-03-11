// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Native is Ownable {
    uint256 public faucetAmount = 0.2 * 10 ** 18;
    uint256 public faucetLimit = 5000 * 10 ** 18;
    uint256 public totalFaucetDistributed;

    mapping(address => uint256) public lastClaimTime;

    event FaucetClaimed(address indexed claimer, uint256 amount);
    event DonationReceived(address indexed donor, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function claimFaucet() external {
        require(totalFaucetDistributed + faucetAmount <= faucetLimit, "Faucet limit reached");
        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + 1 days,
            "Claim only once every 24 hours"
        );
        require(address(this).balance >= faucetAmount, "Insufficient balance in faucet");

        (bool success, ) = msg.sender.call{value: faucetAmount}("");
        require(success, "Native token transfer failed");

        totalFaucetDistributed += faucetAmount;
        lastClaimTime[msg.sender] = block.timestamp;

        emit FaucetClaimed(msg.sender, faucetAmount);
    }

    function depositNative() external payable onlyOwner {
        require(msg.value > 0, "Deposit amount must be greater than 0");
    }

    function withdrawNative(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance in contract");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        emit DonationReceived(msg.sender, msg.value);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        emit DonationReceived(msg.sender, msg.value);
    }
}
