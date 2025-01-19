// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Quiz is Ownable {
    IERC20 public odtToken;
    IERC20 public teaToken;

    mapping(address => uint256) public userPoints;

    constructor(address _odtToken, address _teaToken) Ownable(msg.sender) {
        odtToken = IERC20(_odtToken);
        teaToken = IERC20(_teaToken);
    }

    function joinQuiz() external {
        require(odtToken.balanceOf(msg.sender) >= 10 * 10 ** 18, 'Not enough ODT to join');
        require(odtToken.transferFrom(msg.sender, address(this), 10 * 10 ** 18), 'Transfer failed');
    }

    function submitAnswer(uint256 /* questionId */, bool isCorrect) external {
        if (isCorrect) {
            userPoints[msg.sender]++;
        }
    }

    function claimReward() external {
        uint256 points = userPoints[msg.sender];
        require(points > 0, 'No points to claim');

        uint256 reward = points * 3 * 10 ** 18;
        require(teaToken.balanceOf(address(this)) >= reward, 'Not enough TEA in contract');
        teaToken.transfer(msg.sender, reward);
        userPoints[msg.sender] = 0;
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');
        teaToken.transferFrom(msg.sender, address(this), amount);
    }
}
