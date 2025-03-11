// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenFactory {
    address public nativeContract;
    address public owner;
    uint256 public fee;

    event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply);
    event FeeUpdated(uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor(address _nativeContract, uint256 _fee) {
        require(_nativeContract != address(0), "Invalid native contract address");
        nativeContract = _nativeContract;
        fee = _fee;
        owner = msg.sender;
    }

    function updateFee(uint256 newFee) public onlyOwner {
        fee = newFee;
        emit FeeUpdated(newFee);
    }

    function createToken(string memory name, string memory symbol, uint256 totalSupply) public payable {
        require(msg.value >= fee, "Insufficient fee paid");
        require(totalSupply > 0, "Total supply must be greater than zero");

        uint256 adjustedTotalSupply = totalSupply * 10 ** 18;
        ERC20Token newToken = new ERC20Token(name, symbol, adjustedTotalSupply, msg.sender);

        emit TokenCreated(address(newToken), name, symbol, adjustedTotalSupply);

        if (msg.value > fee) {
            (bool success, ) = msg.sender.call{value: msg.value - fee}("");
            require(success, "Failed to refund excess fee");
        }
    }

    function updateNativeContract(address _nativeContract) public onlyOwner {
        require(_nativeContract != address(0), "Invalid native contract address");
        nativeContract = _nativeContract;
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function forwardFeesToNative() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to forward");
        (bool success, ) = nativeContract.call{value: balance}("");
        require(success, "Failed to forward fees to native contract");
    }
}

contract ERC20Token is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address owner) ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
