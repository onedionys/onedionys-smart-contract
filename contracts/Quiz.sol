// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Quiz is Ownable {
    IERC20 public odtToken;

    uint256 public totalRewardPool;

    mapping(address => uint256) public userPoints;

    constructor(address _odtToken) Ownable(msg.sender) {
        odtToken = IERC20(_odtToken);
    }

    function joinQuiz() external {
        uint256 requiredAmount = 15 * 10 ** 18;
        uint256 ownerShare = 5 * 10 ** 18;
        uint256 contractShare = 10 * 10 ** 18;

        require(odtToken.balanceOf(msg.sender) >= requiredAmount, 'Not enough ODT to join');

        odtToken.transferFrom(msg.sender, owner(), ownerShare);

        odtToken.transferFrom(msg.sender, address(this), contractShare);
    }

    function submitAnswer(bool isCorrect) external {
        if (isCorrect) {
            userPoints[msg.sender]++;
        }
    }

    function calculateReward(address user) public view returns (uint256) {
        uint256 points = userPoints[user];
        uint256 reward = points * 3 * 10 ** 18;
        return reward;
    }

    function claimRewards() external {
        require(userPoints[msg.sender] > 0, 'No points to claim');
        _claimRewards(msg.sender);
    }

    function _claimRewards(address user) internal {
        uint256 reward = calculateReward(user);

        require(totalRewardPool >= reward, 'Not enough tokens in contract for rewards');

        totalRewardPool -= reward;
        odtToken.transfer(user, reward);
        userPoints[msg.sender] = 0;
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');
        odtToken.transferFrom(msg.sender, address(this), amount);
        totalRewardPool += amount;
    }
}
