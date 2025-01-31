import { ethers } from 'ethers';
import process from 'process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
// import ora from 'ora';

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

const contractAddress = process.env.REFERRAL_CONTRACT_ADDRESS;
const contractJson = getABI('Referral.sol/Referral.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const leaderboardAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
const leaderboardJson = getABI('Leaderboard.sol/Leaderboard.json');
const leaderboardAbi = leaderboardJson.abi;
const leaderboardInteraction = new ethers.Contract(leaderboardAddress, leaderboardAbi, mainWallet);

console.log(userWallet, contractInteraction, leaderboardInteraction);
