// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Lottery is Ownable {
    IERC20 public odtToken; // One Dionys Token (ODT)
    IERC721 public nftCollection;

    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lastSpinTime; // The last time the user turned the wheel

    uint256 public ticketPrice = 10 * 10 ** 18; // 10 ODT per ticket
    uint256 public spinCooldown = 5 minutes; // 5-minute cooldown time between each spin

    constructor(address _odtToken, address _nftCollection) Ownable(msg.sender) {
        odtToken = IERC20(_odtToken);
        nftCollection = IERC721(_nftCollection);
    }

    // Function to join the lottery with ODT token
    function joinLottery() external {
        // Ensure the user sends enough ODT to join the lottery
        require(odtToken.transferFrom(msg.sender, address(this), ticketPrice), 'Not enough ODT');
    }

    // Function to spin the lottery wheel
    function spinWheel() external {
        // Ensure that users do not spin within the specified cooldown time
        require(block.timestamp >= lastSpinTime[msg.sender] + spinCooldown, 'You must wait before spinning again');

        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp))) % 8;
        uint256 nftId = random + 1; // NFT ID from 1 to 8
        nftCollection.transferFrom(address(this), msg.sender, nftId);

        userPoints[msg.sender] += nftId; // Add points based on NFT ID

        // Update the last time the user spun the wheel
        lastSpinTime[msg.sender] = block.timestamp;
    }

    // Function to view the leaderboard
    function getLeaderboard() external pure returns (address[] memory, uint256[] memory) {
        address[] memory leaders;
        uint256[] memory points;
        // Sort and display the leaderboard (ranking process)
        return (leaders, points);
    }
}
