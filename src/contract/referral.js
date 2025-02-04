import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { tokenContract } from './token.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.REFERRAL_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Referral.sol/Referral.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const referralContract = contractInteraction;
const referralContractAddress = contractAddress;

export { referralContract, referralContractAddress };

export async function addRewardsReferral(amount) {
    console.log(`🤖 Processing: Add Rewards Referral`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountRewards = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountRewardsFormatted = amountRewards.toLocaleString('en-US');

        const approveTransaction = await tokenContract.approve(contractAddress, amount);
        await approveTransaction.wait();

        const transaction = await contractInteraction.addRewardTokens(amount);
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully added a referral prize of ${amountRewardsFormatted} tokens.`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while adding a referral prize: ${getErrorMessage(error)}`);
    }
}

export async function register(wallet, referrer) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await referralContract.connect(walletInstance).register(referrer);
    await tx.wait();
    console.log('User registered successfully!');
}

export async function getLeaderboard() {
    const [leaderboardAddresses, leaderboardCounts] = await referralContract.getLeaderboard();
    console.log('Leaderboard:');
    leaderboardAddresses.forEach((address, index) => {
        console.log(`- Address: ${address}, Referrals: ${leaderboardCounts[index]}`);
    });
}

export async function getDetails(wallet) {
    const referralDetails = await referralContract.getReferralDetails(wallet.address);
    console.log('Referral details:', referralDetails);
}

export async function gtUserDetails(wallet) {
    const [referralsCount, registrationTime] = await referralContract.getUserDetails(wallet.address);
    console.log(`Referrals Count: ${referralsCount}, Registration Time: ${registrationTime}`);
}

await addRewardsReferral(100);