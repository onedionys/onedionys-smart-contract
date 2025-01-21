// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Lottery is Ownable {
    IERC20 public token;
    IERC721 public nftCollection;

    mapping(address => uint256) public userPoints;
    mapping(address => uint256) public lastSpinTime;

    uint256 public ticketPrice = 10 * 10 ** 18;
    uint256 public spinCooldown = 5 minutes;

    constructor(address _token, address _nftCollection) Ownable(msg.sender) {
        token = IERC20(_token);
        nftCollection = IERC721(_nftCollection);
    }

    function joinLottery() external {
        require(token.transferFrom(msg.sender, address(this), ticketPrice), 'Not enough Token');
    }

    function spinWheel() external {
        require(block.timestamp >= lastSpinTime[msg.sender] + spinCooldown, 'You must wait before spinning again');

        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp))) % 8;
        uint256 nftId = random + 1;
        nftCollection.transferFrom(address(this), msg.sender, nftId);

        userPoints[msg.sender] += nftId;

        lastSpinTime[msg.sender] = block.timestamp;
    }

    function getLeaderboard() external pure returns (address[] memory, uint256[] memory) {
        address[] memory leaders;
        uint256[] memory points;
        return (leaders, points);
    }
}
