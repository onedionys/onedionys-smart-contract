// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NFTCollection is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;

    mapping(uint256 => NFTDetails) public nftDetails;
    address public lotteryContract;

    struct NFTDetails {
        string rarity;
        uint256 points;
        string cid;
    }

    event NFTMinted(address indexed to, uint256 tokenId, string rarity, uint256 points, string cid);

    constructor() ERC721('DionysNFT', 'DNFT') Ownable(msg.sender) {}

    modifier onlyLotteryContract() {
        require(msg.sender == lotteryContract, 'Caller is not the lottery contract');
        _;
    }

    function setLotteryContract(address _lotteryContract) external onlyOwner {
        lotteryContract = _lotteryContract;
    }

    function mint(address to, string memory rarity, uint256 points) external onlyLotteryContract returns (uint256) {
        uint256 tokenId = nextTokenId;

        _safeMint(to, tokenId);

        string memory metadataCID;
        if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked('Common'))) {
            metadataCID = 'bafkreifph4d7ekx6iapuc6jjilbzzxwtv4e722x5wegrgynem2drqjmgxq';
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked('Rare'))) {
            metadataCID = 'bafkreih2cmazhjjb64ezclpszqkmq7penj5pukle45qq6mbgiszt7isoua';
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked('Epic'))) {
            metadataCID = 'bafkreib6p7sv23uigc3trcqvkffhrh73x7b3xzs5i35ofnaysrz53pdpzm';
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked('Legendary'))) {
            metadataCID = 'bafkreib5lvtpafojuzozawae3o4bqvbhs76utylitjvtnfgpshxh6sx2oq';
        }

        nftDetails[tokenId] = NFTDetails(rarity, points, metadataCID);
        _setTokenURI(tokenId, string(abi.encodePacked('https://ipfs.io/ipfs/', metadataCID)));

        nextTokenId++;

        emit NFTMinted(to, tokenId, rarity, points, metadataCID);

        return tokenId;
    }

    function burn(uint256 tokenId) external onlyLotteryContract {
        _burn(tokenId);
        delete nftDetails[tokenId];
    }

    function getNFTDetails(uint256 tokenId) external view returns (string memory, uint256, string memory) {
        NFTDetails memory details = nftDetails[tokenId];
        return (details.rarity, details.points, details.cid);
    }

    function uint2str(uint256 _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return '0';
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + (_i % 10)));
            _i /= 10;
        }
        return string(bstr);
    }
}
