import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Leaderboard.sol/Leaderboard.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

export async function addActivity(address = '', title = '', description = '', amount = 0, transactionHash = '') {
    const spinner = ora('Loading...').start();

    try {
        const transaction = await contractInteraction.addActivity(address, title, description, amount, transactionHash);
        await transaction.wait();
        spinner.stop();

        console.log(`📝 Successfully added activity to leaderboard list`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when adding an activity: ${getErrorMessage(error)}`);
    }
}

export async function getUsers() {}

export async function getActivities() {}

// async function getAllUsersLeaderboard() {
//     const users = await leaderboardContract.getAllUsers();
//     const walletData = await Promise.all(
//         users.map(async (wallet) => {
//             const activities = await leaderboardContract.getActivities(wallet);
//             return {
//                 wallet,
//                 activityCount: activities.length,
//             };
//         }),
//     );

//     console.log(walletData);
// }

// async function getUsersActivity(wallet) {
//     const tx = await leaderboardContract.getActivities(wallet.address);
//     console.log(tx);
// }
