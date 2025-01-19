// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NFTCollection is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721('DionysNFT', 'DNFT') Ownable(msg.sender) {}

    // Function to mint a new NFT, only callable by the contract owner
    function mint(address to) external onlyOwner {
        _safeMint(to, nextTokenId);
        _setTokenURI(
            nextTokenId,
            string(abi.encodePacked('https://ipfs.io/ipfs/your_hash_', uint2str(nextTokenId), '.json'))
        );
        nextTokenId++;
    }

    // Helper function to convert a uint256 value to a string (used to generate dynamic token IDs)
    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        // If the value is 0, return "0" as a string
        if (_i == 0) {
            return '0';
        }
        uint256 j = _i;
        uint256 length;
        // Count the number of digits in the number
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        // Convert each digit of the number to a character in the string
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }
}
