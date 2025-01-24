// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TokenFactory {
    address public teaTokenAddress;
    address public owner;
    uint256 public fee;

    event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply);
    event FeeUpdated(uint256 newFee);

    constructor(address _teaTokenAddress, uint256 _fee) {
        require(_teaTokenAddress != address(0), 'Invalid Tea token address');
        teaTokenAddress = _teaTokenAddress;
        fee = _fee;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only the owner can perform this action');
        _;
    }

    function updateFee(uint256 newFee) public onlyOwner {
        fee = newFee;
        emit FeeUpdated(newFee);
    }

    function createToken(string memory name, string memory symbol, uint256 totalSupply) public {
        require(totalSupply > 0, 'Total supply must be greater than zero');
        require(
            ERC20(teaTokenAddress).transferFrom(msg.sender, address(this), fee),
            'Failed to transfer Tea token as fee'
        );

        uint256 adjustedTotalSupply = totalSupply * 10 ** 18;
        ERC20Token newToken = new ERC20Token(name, symbol, adjustedTotalSupply, msg.sender);

        emit TokenCreated(address(newToken), name, symbol, adjustedTotalSupply);
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = ERC20(teaTokenAddress).balanceOf(address(this));
        require(balance > 0, 'No fees to withdraw');
        ERC20(teaTokenAddress).transfer(owner, balance);
    }
}

contract ERC20Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address owner) ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
