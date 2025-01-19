// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Staking is Ownable {
    IERC20 public odtToken;
    IERC20 public teaToken;

    mapping(address => uint256) public stakedAmounts;
    mapping(address => uint256) public stakingTimestamp;

    uint256 public rewardPerSecond = 0.00001 * 10 ** 18; // Number of rewards given per second of staking

    constructor(address _odtToken, address _teaToken) Ownable(msg.sender) {
        odtToken = IERC20(_odtToken);
        teaToken = IERC20(_teaToken);
    }

    // Function for stake tokens
    function stake(uint256 amount) external {
        require(amount > 0, 'Amount should be greater than 0');

        // ODT transfer to contract for staking
        odtToken.transferFrom(msg.sender, address(this), amount);

        // Update staking amount and staking time
        stakedAmounts[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
    }

    // Function to unstake tokens
    function unstake(uint256 amount) external {
        require(stakedAmounts[msg.sender] >= amount, 'Not enough staked');

        // Reduce the number of stakes
        stakedAmounts[msg.sender] -= amount;

        // Transfer the token back to the user
        odtToken.transfer(msg.sender, amount);
    }

    // Function to claim rewards
    function claimRewards() external {
        uint256 stakedAmount = stakedAmounts[msg.sender];
        require(stakedAmount > 0, 'No tokens staked');

        // Calculate the staking duration in seconds
        uint256 stakingDuration = block.timestamp - stakingTimestamp[msg.sender];

        // Reward calculation based on staking duration
        uint256 reward = (rewardPerSecond * stakedAmount * stakingDuration) / 1; // Using seconds as a unit of time

        require(teaToken.balanceOf(address(this)) >= reward, 'Not enough TEA in contract for rewards');

        // Transfer rewards to users
        teaToken.transfer(msg.sender, reward);

        // Update staking time
        stakingTimestamp[msg.sender] = block.timestamp;
    }

    // Function to add reward token
    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');
        teaToken.transferFrom(msg.sender, address(this), amount);
    }

    // Function to set the number of rewards per second
    function setRewardPerSecond(uint256 newRewardPerSecond) external onlyOwner {
        require(newRewardPerSecond > 0, 'Reward per second must be greater than 0');
        rewardPerSecond = newRewardPerSecond;
    }
}
