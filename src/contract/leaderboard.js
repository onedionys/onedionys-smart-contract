import { ethers } from 'ethers';
import process from 'process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const getABI = (toPath = '') => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, `./artifacts/contracts/${toPath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return JSON.parse(fileContent);
};

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
const contractJson = getABI('Leaderboard.sol/Leaderboard.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

console.log(userWallet, contractInteraction);
