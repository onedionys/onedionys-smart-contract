// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Quiz is Ownable {
    IERC20 public token;

    uint256 public totalRewardPool;
    uint256 public maxReward = 10 * 2 * 10 ** 18;
    uint256 public requiredAmount = 10 * 10 ** 18;
    uint256 public timePerQuestion = 60;
    uint256 public totalQuestions = 10;

    mapping(address => uint256) public userPoints;
    mapping(address => bool) public isParticipant;
    mapping(address => uint256) public questionStartTime;
    mapping(address => uint256) public currentQuestionIndex;

    event QuizJoined(address indexed user, uint256 amount);
    event AnswerSubmitted(address indexed user, bool isCorrect);
    event QuestionSkipped(address indexed user);
    event RewardsClaimed(address indexed user, uint256 reward);
    event RewardTokensAdded(uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function joinQuiz() external {
        uint256 ownerShare = 5 * 10 ** 18;
        uint256 contractShare = 5 * 10 ** 18;

        require(token.balanceOf(msg.sender) >= requiredAmount, "Not enough token to join");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= requiredAmount, "Allowance not sufficient to join quiz");

        token.transferFrom(msg.sender, owner(), ownerShare);

        token.transferFrom(msg.sender, address(this), contractShare);

        if (userPoints[msg.sender] > 0) {
            _claimRewards(msg.sender);
        }

        isParticipant[msg.sender] = true;
        questionStartTime[msg.sender] = block.timestamp;
        currentQuestionIndex[msg.sender] = 0;

        emit QuizJoined(msg.sender, requiredAmount);
    }

    function submitAnswer(bool isCorrect, address user) external {
        require(isParticipant[user], "User not joined in quiz");
        require(currentQuestionIndex[user] < totalQuestions, "Quiz completed");

        if (block.timestamp - questionStartTime[user] > timePerQuestion) {
            skipQuestion(user);
            return;
        }

        if (isCorrect) {
            userPoints[user]++;
        }

        currentQuestionIndex[user]++;
        questionStartTime[user] = block.timestamp;

        emit AnswerSubmitted(user, isCorrect);
    }

    function skipQuestion(address user) public {
        require(isParticipant[user], "User not joined in quiz");
        require(currentQuestionIndex[user] < totalQuestions, "Quiz completed");

        currentQuestionIndex[user]++;
        questionStartTime[user] = block.timestamp;

        emit QuestionSkipped(user);
    }

    function calculateReward(address user) public view returns (uint256) {
        uint256 points = userPoints[user];
        uint256 reward = points * 2 * 10 ** 18;

        if (reward > maxReward) {
            reward = maxReward;
        }

        return reward;
    }

    function claimRewards() external {
        require(userPoints[msg.sender] > 0, "No points to claim");
        require(isParticipant[msg.sender], "Not a participant");

        _claimRewards(msg.sender);
    }

    function _claimRewards(address user) internal {
        uint256 reward = calculateReward(user);

        require(totalRewardPool >= reward, "Not enough tokens in contract for rewards");

        totalRewardPool -= reward;
        token.transfer(user, reward);

        userPoints[user] = 0;
        isParticipant[user] = false;
        currentQuestionIndex[msg.sender] = 0;
        questionStartTime[msg.sender] = 0;

        emit RewardsClaimed(user, reward);
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount should be greater than 0");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Allowance not sufficient to add reward tokens");

        token.transferFrom(msg.sender, address(this), amount);
        totalRewardPool += amount;

        emit RewardTokensAdded(amount);
    }
}
