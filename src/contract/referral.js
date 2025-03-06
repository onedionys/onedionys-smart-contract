import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { tokenContract } from './token.js';
import { addActivity } from './leaderboard.js';

const activeProject = process.env.ACTIVE_PROJECT;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL_REDDIO);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.REFERRAL_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Referral.sol/Referral.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const referralContract = contractInteraction;
const referralContractAddress = contractAddress;

export { referralContract, referralContractAddress };

export async function addRewardsReferral(amount = 0) {
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

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL_REDDIO}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully added a referral prize of ${amountRewardsFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while adding a referral prize: ${getErrorMessage(error)}`);
    }
}

export async function register(wallet, referrer) {
    console.log(`🤖 Processing: Referral Signup`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.register(referrer);
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Referral Signup',
            `Register using the referral code.`,
            0,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL_REDDIO}tx/${receipt.transactionHash}`);
        console.log(`✅ Successful registration using referral`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while registering using a referral: ${getErrorMessage(error)}`);
    }
}

export async function getLeaderboard() {
    const spinner = ora('Loading...').start();

    try {
        const [addresses, counts] = await contractInteraction.getLeaderboard();
        const leaderboard = addresses.map((addr, index) => ({
            address: addr,
            counts: counts[index].toNumber(),
        }));

        spinner.stop();
        return leaderboard;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the leaderboard list: ${getErrorMessage(error)}`);
        return [];
    }
}

export async function getDetails(wallet) {
    const spinner = ora('Loading...').start();

    try {
        const referral = await contractInteraction.getReferralDetails(wallet.address);
        const activities = referral.map((ref) => ({
            referredWallet: ref.referredWallet,
            registrationTime: ref.registrationTime.toNumber(),
        }));

        spinner.stop();
        return activities;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the details: ${getErrorMessage(error)}`);
        return [];
    }
}

export async function getUserDetails(wallet) {
    const spinner = ora('Loading...').start();

    try {
        const [referralsCount, registrationTime] = await contractInteraction.getUserDetails(wallet.address);

        spinner.stop();
        if (typeof referralsCount != 'undefined') {
            return {
                count: referralsCount.toNumber(),
                timestamp: registrationTime.toNumber(),
            };
        } else {
            return null;
        }
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the user details: ${getErrorMessage(error)}`);
        return null;
    }
}
