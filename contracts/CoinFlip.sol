// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface INative {
    function donate() external payable;
    function getContractBalance() external view returns (uint256);
}

contract CoinFlip {
    address public nativeContract;
    uint256 public constant INITIAL_BET = 5 * 10 ** 18;

    mapping(address => uint256) public winnings;

    event FlipResult(address indexed player, bool won, uint256 amountWon, bool doubleOrNothing);

    event WinningsClaimed(address indexed player, uint256 amount);

    constructor(address _nativeContract) {
        nativeContract = _nativeContract;
    }

    function flip(bool guessHeads) external payable {
        require(msg.value == INITIAL_BET, 'Bet amount must be exactly 5 TEA');
        require(winnings[msg.sender] == 0, 'You must finish double or nothing first');

        INative(nativeContract).donate{value: msg.value}();

        uint256 flipResult = random() % 2;
        bool won = (flipResult == 0 && guessHeads) || (flipResult == 1 && !guessHeads);

        if (won) {
            winnings[msg.sender] = INITIAL_BET * 2;
            emit FlipResult(msg.sender, true, winnings[msg.sender], false);
        } else {
            emit FlipResult(msg.sender, false, 0, false);
        }
    }

    function doubleOrNothing(bool guessHeads) external {
        uint256 currentWinnings = winnings[msg.sender];
        require(currentWinnings > 0, 'You have no winnings to double');
        require(
            INative(nativeContract).getContractBalance() >= currentWinnings * 2,
            'Native contract does not have enough balance'
        );

        uint256 flipResult = random() % 2;
        bool won = (flipResult == 0 && guessHeads) || (flipResult == 1 && !guessHeads);

        if (won) {
            winnings[msg.sender] *= 2;
            emit FlipResult(msg.sender, true, winnings[msg.sender], true);
        } else {
            winnings[msg.sender] = 0;
            emit FlipResult(msg.sender, false, 0, true);
        }
    }

    function claimWinnings() external {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, 'No winnings to claim');

        winnings[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}('');
        require(success, 'Reward transfer failed');

        emit WinningsClaimed(msg.sender, amount);
    }

    function getUserWinnings(address user) external view returns (uint256) {
        return winnings[user];
    }

    function random() internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)));
    }
}
