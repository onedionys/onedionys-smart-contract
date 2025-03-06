import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';

const activeProject = process.env.ACTIVE_PROJECT;
const rpcNetworkUrl = process.env[`RPC_URL_${activeProject.toUpperCase()}`];
const blockExplorerUrl = process.env[`BLOCK_EXPLORER_URL_${activeProject.toUpperCase()}`];

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL_REDDIO);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Leaderboard.sol/Leaderboard.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const leaderboardContract = contractInteraction;
const leaderboardContractAddress = contractAddress;

export { leaderboardContract, leaderboardContractAddress };

export async function addActivity(address = '', title = '', description = '', amount = 0, transactionHash = '') {
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);

        const transaction = await contractInteraction.addActivity(address, title, description, amount, transactionHash, []);
        await transaction.wait();
        spinner.stop();

        console.log(`📝 Successfully added activity to leaderboard list`);
    } catch (error) {
        spinner.stop();
        console.log(error);
        console.log(`❌ An error occurred when adding an activity: ${getErrorMessage(error)}`);
    }
}

export async function getUsers() {
    const spinner = ora('Loading...').start();

    try {
        const wallet = await contractInteraction.getAllUsers();
        const walletData = await Promise.all(
            wallet.map(async (wallet) => {
                const activities = await contractInteraction.getActivities(wallet);
                return {
                    wallet,
                    activityCount: activities.length,
                };
            }),
        );
        spinner.stop();

        return walletData;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when getting the user list: ${getErrorMessage(error)}`);
        return [];
    }
}

export async function getActivities(address = '') {
    const spinner = ora('Loading...').start();

    try {
        const activities = await contractInteraction.getActivities(address);
        const activitiesData = activities
            .map((wallet) => {
                const amountFloat = parseFloat(ethers.utils.formatUnits(wallet.amount, 18));

                return {
                    activity: wallet.activity,
                    description: wallet.description,
                    amount: amountFloat,
                    timestamp: wallet.timestamp.toNumber(),
                    txhash: wallet.txhash,
                };
            })
            .filter((item) => item !== null);
        spinner.stop();

        return activitiesData;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the user activity list: ${getErrorMessage(error)}`);
        return [];
    }
}
