// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Batch {
    event SmallTransfered(address indexed user, uint256 timestamp);

    function smallTransfer() public {
        emit SmallTransfered(msg.sender, block.timestamp);
    }
}