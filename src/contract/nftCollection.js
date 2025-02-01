import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.NFT_COLLECTION_CONTRACT_ADDRESS;
const contractJson = getJsonABI('NFTCollection.sol/NFTCollection.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

async function setLotteryContract() {
    const tx = await nftCollectionContract.setLotteryContract(lotteryContractAddress);
    await tx.wait();
    console.log('Lottery contract set successfully in NFTCollection contract.');
}

async function getNFTDetails(tokenId) {
    const [rarity, points, cid] = await nftCollectionContract.getNFTDetails(tokenId);
    console.log(`NFT Details: Token ID: ${tokenId}, Rarity: ${rarity}, Points: ${points}, CID: ${cid}`);
}
