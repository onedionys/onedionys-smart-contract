import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.REFERRAL_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Referral.sol/Referral.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

async function reffAddRewardTokens(amount) {
    const rewardAmount = ethers.utils.parseUnits(amount.toString(), 18);

    const approveTx = await tokenContract.approve(referralContractAddress, rewardAmount);
    await approveTx.wait();
    console.log(`Approved ${amount} token for reward pool.`);

    const addRewardTx = await referralContract.addRewardTokens(rewardAmount);
    await addRewardTx.wait();
    console.log(`Added ${amount} token as reward tokens.`);
}

async function reffRegister(wallet, referrer) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await referralContract.connect(walletInstance).register(referrer);
    await tx.wait();
    console.log('User registered successfully!');
}

async function reffGetLeaderboard() {
    const [leaderboardAddresses, leaderboardCounts] = await referralContract.getLeaderboard();
    console.log('Leaderboard:');
    leaderboardAddresses.forEach((address, index) => {
        console.log(`- Address: ${address}, Referrals: ${leaderboardCounts[index]}`);
    });
}

async function reffGetReferralDetails(wallet) {
    const referralDetails = await referralContract.getReferralDetails(wallet.address);
    console.log('Referral details:', referralDetails);
}

async function reffGetUserDetails(wallet) {
    const [referralsCount, registrationTime] = await referralContract.getUserDetails(wallet.address);
    console.log(`Referrals Count: ${referralsCount}, Registration Time: ${registrationTime}`);
}
