// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Staking is Ownable {
    IERC20 public token;

    uint256 public totalRewardPool;
    uint256 public rewardPerSecond = 0.000001 * 10 ** 18;
    uint256 public totalStaked;

    mapping(address => uint256) public stakedAmounts;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public lastClaimedTimestamp;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 reward);
    event RewardTokensAdded(uint256 amount);
    event RewardPerSecondUpdated(uint256 newRewardPerSecond);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function stake(uint256 amount) external {
        require(amount > 0, 'Amount should be greater than 0');
        require(token.balanceOf(msg.sender) >= amount, 'Insufficient balance for staking');

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, 'Allowance not sufficient for staking');

        token.transferFrom(msg.sender, address(this), amount);

        if (stakedAmounts[msg.sender] > 0) {
            _claimRewards(msg.sender);
        }

        stakedAmounts[msg.sender] += amount;
        totalStaked += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
        lastClaimedTimestamp[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, 'Amount must be greater than zero');
        require(stakedAmounts[msg.sender] >= amount, 'Not enough staked');

        _claimRewards(msg.sender);
        stakedAmounts[msg.sender] -= amount;
        totalStaked -= amount;

        token.transfer(msg.sender, amount);

        if (stakedAmounts[msg.sender] == 0) {
            stakingTimestamp[msg.sender] = 0;
            lastClaimedTimestamp[msg.sender] = 0;
        } else {
            lastClaimedTimestamp[msg.sender] = block.timestamp;
        }

        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        require(stakedAmounts[msg.sender] > 0, 'No tokens staked');
        _claimRewards(msg.sender);
    }

    function _claimRewards(address user) internal {
        uint256 stakingDuration = block.timestamp - lastClaimedTimestamp[user];
        uint256 reward = (rewardPerSecond * stakingDuration * stakedAmounts[user]) / 1e18;

        require(totalRewardPool >= reward, 'Not enough tokens in contract for rewards');

        totalRewardPool -= reward;
        token.transfer(user, reward);
        lastClaimedTimestamp[user] = block.timestamp;

        emit RewardsClaimed(user, reward);
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, 'Allowance not sufficient to add reward tokens');

        token.transferFrom(msg.sender, address(this), amount);
        totalRewardPool += amount;

        emit RewardTokensAdded(amount);
    }

    function setRewardPerSecond(uint256 newRewardPerSecond) external onlyOwner {
        require(newRewardPerSecond > 0, 'Reward per second must be greater than 0');
        rewardPerSecond = newRewardPerSecond;

        emit RewardPerSecondUpdated(newRewardPerSecond);
    }

    function calculatePendingRewards(address user) public view returns (uint256) {
        uint256 stakingDuration = block.timestamp - lastClaimedTimestamp[user];
        uint256 reward = (rewardPerSecond * stakingDuration * stakedAmounts[user]) / 1e18;
        return reward;
    }

    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
}
