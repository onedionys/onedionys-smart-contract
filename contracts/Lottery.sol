// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

interface INFTCollection {
    function mint(address to, string memory rarity, uint256 points) external;
}

contract Lottery is Ownable {
    IERC20 public token;
    INFTCollection public nftCollection;

    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lastSpinTime;

    uint256 public ticketPrice = 10 * 10 ** 18;
    uint256 public spinCooldown = 5 minutes;

    address[] public leaderboard;
    mapping(address => bool) public isInLeaderboard;

    event JoinedLottery(address indexed user, uint256 amount);
    event SpinWheel(address indexed user, string rarity, uint256 points);
    event LeaderboardUpdated(address indexed user, uint256 points);

    constructor(address _token, address _nftCollection) Ownable(msg.sender) {
        token = IERC20(_token);
        nftCollection = INFTCollection(_nftCollection);
    }

    function joinLottery() external {
        require(token.transferFrom(msg.sender, address(this), ticketPrice), 'Insufficient tokens');
        emit JoinedLottery(msg.sender, ticketPrice);
    }

    function spinWheel() external {
        require(block.timestamp >= lastSpinTime[msg.sender] + spinCooldown, 'Spin cooldown active');
        require(token.transferFrom(msg.sender, address(this), ticketPrice), 'Insufficient tokens');

        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender))) % 100;

        string memory rarity;
        uint256 points;

        if (random < 50) {
            rarity = 'Common';
            points = 10;
        } else if (random < 80) {
            rarity = 'Rare';
            points = 25;
        } else if (random < 95) {
            rarity = 'Epic';
            points = 50;
        } else {
            rarity = 'Legendary';
            points = 100;
        }

        nftCollection.mint(msg.sender, rarity, points);

        userPoints[msg.sender] += points;
        lastSpinTime[msg.sender] = block.timestamp;

        _updateLeaderboard(msg.sender);

        emit SpinWheel(msg.sender, rarity, points);
    }

    function _updateLeaderboard(address user) internal {
        if (!isInLeaderboard[user]) {
            leaderboard.push(user);
            isInLeaderboard[user] = true;
        }

        emit LeaderboardUpdated(user, userPoints[user]);
    }

    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 length = leaderboard.length;
        address[] memory leaders = new address[](length);
        uint256[] memory points = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            leaders[i] = leaderboard[i];
            points[i] = userPoints[leaders[i]];
        }

        return (leaders, points);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, 'No tokens to withdraw');
        require(token.transfer(msg.sender, balance), 'Withdrawal failed');
    }
}
