// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NameService {
    uint256 public constant registrationFee = 20 * 10 ** 18;
    string public domainExtension = '.chai';
    address public owner;

    mapping(string => address) public nameToOwner;
    mapping(address => string[]) public ownerToNames;

    event NameRegistered(address indexed owner, string indexed name);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only contract owner can perform this action');
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerName(string calldata name) external payable {
        require(bytes(name).length > 0, 'Name cannot be empty');
        require(msg.value >= registrationFee, 'Insufficient registration fee');
        string memory fullName = string(abi.encodePacked(name, domainExtension));
        require(nameToOwner[fullName] == address(0), 'Name already registered');

        nameToOwner[fullName] = msg.sender;
        ownerToNames[msg.sender].push(fullName);

        emit NameRegistered(msg.sender, fullName);
    }

    function getNamesByOwner(address user) external view returns (string[] memory) {
        return ownerToNames[user];
    }

    function getOwner(string calldata name) external view returns (address) {
        string memory fullName = string(abi.encodePacked(name, domainExtension));
        return nameToOwner[fullName];
    }

    function withdrawFunds() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
