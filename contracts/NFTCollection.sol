// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract NFTCollection is ERC721URIStorage, Ownable {
    struct NFTDetails {
        string rarity;
        uint256 points;
        string cid;
    }

    uint256 public nextTokenId;
    address public lotteryContract;

    mapping(uint256 => NFTDetails) public nftDetails;
    mapping(address => uint256[]) private userTokens;
    mapping(string => string) public rarityMetadataCID;

    event NFTMinted(address indexed to, uint256 tokenId, string rarity, uint256 points, string cid);
    event NFTBurned(address indexed owner, uint256 tokenId);

    constructor() ERC721('Dion NFT v1', 'DNN1') Ownable(msg.sender) {
        rarityMetadataCID['Common'] = 'bafkreiglegydzpdxrvszs554pogs7uuvc5iqykmsibk6dtcbiohqrgnohu';
        rarityMetadataCID['Uncommon'] = 'bafkreihxegzellny3ftx3zcti2aorl5n7iwdkb7cdwwdlvna5hq3e2hgom';
        rarityMetadataCID['Rare'] = 'bafkreiejp4jbxq3jc6utjvehlflga37rhqd7eudr5fasucvo5ffaqnmfje';
        rarityMetadataCID['Epic'] = 'bafkreicqyeyz4bnn4jb4f3r3y6fl7524grxrcddflvy5rccylo6saa5l6y';
        rarityMetadataCID['Legendary'] = 'bafkreienytu72bahf5jbf4u5477niaeull5s2pl2dk4pz6cses5cbajnya';
        rarityMetadataCID['Mythic'] = 'bafkreidw7qtpq2n2qte66hqftpavcfdyamo44nwqsn2sfachjvgtofyqpu';
        rarityMetadataCID['Godlike'] = 'bafkreicmouxjpsgabx7rwtnwavj5lllstwdiihbovht2ajspadpbfp2bmm';
        rarityMetadataCID['Unique'] = 'bafkreiaijtv5ipk3asyvnecjkqpemfpbuzu2janzihbdabwn4z4qnhktm4';
    }

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

        string memory metadataCID = rarityMetadataCID[rarity];

        nftDetails[tokenId] = NFTDetails(rarity, points, metadataCID);
        userTokens[to].push(tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked('https://ipfs.io/ipfs/', metadataCID)));

        nextTokenId++;

        emit NFTMinted(to, tokenId, rarity, points, metadataCID);

        return tokenId;
    }

    function burn(uint256 tokenId) external onlyLotteryContract {
        address owner = ownerOf(tokenId);
        _removeTokenFromUser(owner, tokenId);

        _burn(tokenId);
        delete nftDetails[tokenId];
        emit NFTBurned(owner, tokenId);
    }

    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }

    function _removeTokenFromUser(address user, uint256 tokenId) private {
        uint256[] storage tokens = userTokens[user];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    function getNFTDetails(uint256 tokenId) external view returns (string memory, uint256, string memory) {
        NFTDetails memory details = nftDetails[tokenId];
        return (details.rarity, details.points, details.cid);
    }

    function setRarityMetadataCID(string memory rarity, string memory cid) external onlyOwner {
        rarityMetadataCID[rarity] = cid;
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
