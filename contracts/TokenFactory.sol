// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TokenFactory {
    event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply);

    function createToken(string memory name, string memory symbol, uint256 totalSupply) public {
        require(totalSupply > 0, 'Total supply must be greater than zero');

        uint256 adjustedTotalSupply = totalSupply * 10 ** 18;
        ERC20Token newToken = new ERC20Token(name, symbol, adjustedTotalSupply, msg.sender);

        emit TokenCreated(address(newToken), name, symbol, adjustedTotalSupply);
    }
}

contract ERC20Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address owner) ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
