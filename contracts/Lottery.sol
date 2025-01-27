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
    function getUserTokens(address user) external view returns (uint256[] memory);
}

contract Lottery is Ownable {
    IERC20 public token;
    INFTCollection public nftCollection;

    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lastSpinTime;

    uint256 public ticketPrice = 10 * 10 ** 18;
    uint256 public spinCooldown = 1 minutes;
    uint256 public totalRewardPool;

    struct LeaderboardEntry {
        address user;
        uint256 points;
    }

    LeaderboardEntry[] public leaderboard;

    event SpinWheel(address indexed user, string rarity, uint256 points, string cid);
    event LeaderboardUpdated(address indexed user, uint256 points);
    event Withdraw(address indexed user, uint256 points);
    event RewardTokensAdded(uint256 amount);

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
        } else if (random < 75) {
            rarity = 'Uncommon';
            points = 25;
        } else if (random < 85) {
            rarity = 'Rare';
            points = 50;
        } else if (random < 90) {
            rarity = 'Epic';
            points = 75;
        } else if (random < 97) {
            rarity = 'Legendary';
            points = 100;
        } else if (random < 99) {
            rarity = 'Mythic';
            points = 200;
        } else if (random < 100) {
            rarity = 'Godlike';
            points = 300;
        } else {
            rarity = 'Unique';
            points = 500;
        }

        uint256 tokenId = nftCollection.mint(msg.sender, rarity, points);

        userPoints[msg.sender] += points;
        lastSpinTime[msg.sender] = block.timestamp;

        _updateLeaderboard(msg.sender);

        (, , string memory cid) = nftCollection.getNFTDetails(tokenId);

        emit SpinWheel(msg.sender, rarity, points, cid);
    }

    function _updateLeaderboard(address user) internal {
        bool found = false;

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].user == user) {
                leaderboard[i].points = userPoints[user];
                found = true;
                break;
            }
        }

        if (!found) {
            leaderboard.push(LeaderboardEntry(user, userPoints[user]));
        }

        _sortLeaderboard();
        emit LeaderboardUpdated(user, userPoints[user]);
    }

    function _sortLeaderboard() internal {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            for (uint256 j = i + 1; j < leaderboard.length; j++) {
                if (leaderboard[j].points > leaderboard[i].points) {
                    LeaderboardEntry memory temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }
    }

    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        address[] memory users = new address[](leaderboard.length);
        uint256[] memory points = new uint256[](leaderboard.length);

        for (uint256 i = 0; i < leaderboard.length; i++) {
            users[i] = leaderboard[i].user;
            points[i] = leaderboard[i].points;
        }

        return (users, points);
    }

    function withdrawTokens() external {
        uint256 points = userPoints[msg.sender];
        require(points > 0, 'No points to withdraw');
        require(totalRewardPool >= points, 'Not enough tokens in contract for rewards');

        uint256 transferAmount = points * (10 ** 18);
        require(token.transfer(msg.sender, transferAmount), 'Transfer failed');

        totalRewardPool -= points;
        userPoints[msg.sender] = 0;
        lastSpinTime[msg.sender] = 0;

        _removeFromLeaderboard(msg.sender);

        uint256[] memory userTokens = nftCollection.getUserTokens(msg.sender);
        for (uint256 i = 0; i < userTokens.length; i++) {
            nftCollection.burn(userTokens[i]);
        }

        emit Withdraw(msg.sender, points);
    }

    function _removeFromLeaderboard(address user) internal {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].user == user) {
                leaderboard[i] = leaderboard[leaderboard.length - 1];
                leaderboard.pop();
                break;
            }
        }

        _sortLeaderboard();
    }

    function burnNft(uint256 tokenId) external {
        (, uint256 points, ) = nftCollection.getNFTDetails(tokenId);
        require(points > 0, 'Invalid NFT points');
        require(totalRewardPool >= points, 'Not enough tokens in contract for rewards');

        uint256 transferAmount = points * (10 ** 18);
        require(token.transfer(msg.sender, transferAmount), 'Transfer failed');

        totalRewardPool -= points;
        userPoints[msg.sender] -= points;

        if (userPoints[msg.sender] == 0) {
            _removeFromLeaderboard(msg.sender);
        }

        nftCollection.burn(tokenId);

        emit Withdraw(msg.sender, points);
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, 'Allowance not sufficient to add reward tokens');

        token.transferFrom(msg.sender, address(this), amount);
        totalRewardPool += amount;

        emit RewardTokensAdded(amount);
    }
}
