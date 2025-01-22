// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

interface INFTCollection {
    function mint(address to, string memory rarity, uint256 points) external returns (uint256);
    function burn(uint256 tokenId) external;
    function getNFTDetails(
        uint256 tokenId
    ) external view returns (string memory rarity, uint256 points, string memory cid);
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

    event SpinWheel(address indexed user, string rarity, uint256 points, string cid);
    event LeaderboardUpdated(address indexed user, uint256 points);
    event Withdraw(address indexed user, uint256 points);

    constructor(address _token, address _nftCollection) Ownable(msg.sender) {
        token = IERC20(_token);
        nftCollection = INFTCollection(_nftCollection);
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

        uint256 tokenId = nftCollection.mint(msg.sender, rarity, points);

        userPoints[msg.sender] += points;
        lastSpinTime[msg.sender] = block.timestamp;

        _updateLeaderboard(msg.sender);

        (, , string memory cid) = nftCollection.getNFTDetails(tokenId);

        emit SpinWheel(msg.sender, rarity, points, cid);
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

    function withdrawTokens() external {
        uint256 points = userPoints[msg.sender];
        require(points > 0, 'No points to withdraw');

        require(token.transfer(msg.sender, points), 'Transfer failed');

        userPoints[msg.sender] = 0;
        lastSpinTime[msg.sender] = 0;
        isInLeaderboard[msg.sender] = false;

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == msg.sender) {
                leaderboard[i] = leaderboard[leaderboard.length - 1];
                leaderboard.pop();
                break;
            }
        }

        emit Withdraw(msg.sender, points);
    }

    function burnNft(uint256 tokenId) external {
        (, uint256 points, ) = nftCollection.getNFTDetails(tokenId);
        require(points > 0, 'Invalid NFT points');

        require(token.transfer(msg.sender, points), 'Transfer failed');
        nftCollection.burn(tokenId);

        emit Withdraw(msg.sender, points);
    }
}
