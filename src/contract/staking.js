import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.STAKING_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Staking.sol/Staking.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

async function addRewardTokensStaking(amount) {
    const rewardAmount = ethers.utils.parseUnits(amount.toString(), 18);

    const approveTx = await tokenContract.approve(stakingContractAddress, rewardAmount);
    await approveTx.wait();
    console.log(`Approved ${amount} token for reward pool.`);

    const addRewardTx = await stakingContract.addRewardTokens(rewardAmount);
    await addRewardTx.wait();
    console.log(`Added ${amount} token as reward tokens.`);
}

async function stakeToken(wallet, amount) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const stakeAmount = ethers.utils.parseUnits(amount.toString(), 18);

    const approveTx = await tokenContract.connect(walletInstance).approve(stakingContractAddress, stakeAmount);
    await approveTx.wait();
    console.log(`Approved ${amount} token for staking contract by ${wallet.address}`);

    const stakingTx = await stakingContract.connect(walletInstance).stake(stakeAmount);
    const receipt = await stakingTx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Stake Token',
        'Users stake token',
        amount,
        txHash,
    );
    await addActivityTx.wait();
    console.log(`Staked ${amount} token by ${wallet.address}`);
}

async function unstakeToken(wallet, amount) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const stakeAmount = ethers.utils.parseUnits(amount.toString(), 18);

    const approveTx = await tokenContract.connect(walletInstance).approve(stakingContractAddress, stakeAmount);
    await approveTx.wait();
    console.log(`Approved ${amount} token for unstaking contract by ${wallet.address}`);

    const unstakingTx = await stakingContract.connect(walletInstance).unstake(stakeAmount);
    const receipt = await unstakingTx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Unstake Token',
        'Users unstake token',
        amount,
        txHash,
    );
    await addActivityTx.wait();

    console.log(`Unstaked ${amount} token by ${wallet.address}`);
}

async function claimRewards(wallet) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await stakingContract.connect(walletInstance).claimRewards();
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Claim Rewards Token',
        'Users claim rewards token',
        1000,
        txHash,
    );
    await addActivityTx.wait();
    console.log(`Rewards claimed by ${wallet.address}`);
}
