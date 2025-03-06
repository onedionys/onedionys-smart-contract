import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { lotteryContractAddress } from './lottery.js';

const activeProject = process.env.ACTIVE_PROJECT;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL_REDDIO);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.NFT_COLLECTION_CONTRACT_ADDRESS;
const contractJson = getJsonABI('NFTCollection.sol/NFTCollection.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const nftCollectionContract = contractInteraction;
const nftCollectionContractAddress = contractAddress;

export { nftCollectionContract, nftCollectionContractAddress };

export async function setLotteryContract() {
    console.log(`🤖 Processing: Initializing a Lottery Contract`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const transaction = await contractInteraction.setLotteryContract(lotteryContractAddress);
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL_REDDIO}tx/${receipt.transactionHash}`);
        console.log(`✅ Lottery contract successfully established in NFTCollection contract`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when setting the lottery contract: ${getErrorMessage(error)}`);
    }
}

export async function getNFTDetails(tokenId = 0) {
    const spinner = ora('Loading...').start();

    try {
        const [rarity, points, cid] = await contractInteraction.getNFTDetails(tokenId);
        spinner.stop();

        return {
            tokenId: tokenId,
            rarity: rarity,
            points: points.toNumber(),
            cid: cid,
        };
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the NFT details: ${getErrorMessage(error)}`);
        return null;
    }
}
