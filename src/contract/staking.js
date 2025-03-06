import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';
import { tokenContract } from './token.js';

const activeProject = process.env.ACTIVE_PROJECT;
const rpcNetworkUrl = process.env[`RPC_URL_${activeProject.toUpperCase()}`];
const blockExplorerUrl = process.env[`BLOCK_EXPLORER_URL_${activeProject.toUpperCase()}`];

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env[`STAKING_CONTRACT_ADDRESS_${activeProject.toUpperCase()}`];
const contractJson = getJsonABI('Staking.sol/Staking.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const stakingContract = contractInteraction;
const stakingContractAddress = contractAddress;

export { stakingContract, stakingContractAddress };

export async function addRewardsStaking(amount) {
    console.log(`🤖 Processing: Add Rewards Staking`);
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

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully added a staking prize of ${amountRewardsFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while adding a staking prize: ${getErrorMessage(error)}`);
    }
}

export async function stake(wallet, amount) {
    console.log(`🤖 Processing: Token Staking`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountStaked = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountStakedFormatted = amountStaked.toLocaleString('en-US');

        const connectTokenWallet = tokenContract.connect(wallet);
        const connectWallet = contractInteraction.connect(wallet);

        const approveTransaction = await connectTokenWallet.approve(contractAddress, amount);
        await approveTransaction.wait();

        const transaction = await connectWallet.stake(amount);
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Token Staking',
            `Staked ${amountStakedFormatted} tokens to earn rewards.`,
            amountStaked,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully stake ${amountStakedFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while staking the token: ${getErrorMessage(error)}`);
    }
}

export async function unstake(wallet, amount) {
    console.log(`🤖 Processing: Unstake Tokens`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountUnstaked = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountUnstakedFormatted = amountUnstaked.toLocaleString('en-US');

        const connectTokenWallet = tokenContract.connect(wallet);
        const connectWallet = contractInteraction.connect(wallet);

        const approveTransaction = await connectTokenWallet.approve(contractAddress, amount);
        await approveTransaction.wait();

        const transaction = await connectWallet.unstake(amount);
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Unstake Tokens',
            `Unstaked ${amountUnstakedFormatted} tokens.`,
            amountUnstaked,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully unstake ${amountUnstakedFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while unstaking the token: ${getErrorMessage(error)}`);
    }
}

export async function withdraw(wallet) {
    console.log(`🤖 Processing: Staking Rewards Claim`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface(['event RewardsClaimed(address indexed user, uint256 reward)']);

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.claimRewards();
        const receipt = await transaction.wait();

        let amountRewards = 0;

        receipt.logs.some((log) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog.name === 'RewardsClaimed') {
                    amountRewards = parseFloat(ethers.utils.formatUnits(parsedLog.args.reward.toString(), 18));
                    return true;
                }
            } catch (e) {
                void e;
            }
            return false;
        });

        const amountRewardsFormatted = amountRewards.toLocaleString('en-US');

        await addActivity(
            wallet.address,
            'Staking Rewards Claim',
            `Claimed ${amountRewardsFormatted} tokens from staking rewards.`,
            amountRewards,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully claimed ${amountRewardsFormatted} tokens from staking rewards`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when claiming a staking reward: ${getErrorMessage(error)}`);
    }
}
