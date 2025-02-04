import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { tokenContract } from './token.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.QUIZ_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Quiz.sol/Quiz.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const quizContract = contractInteraction;
const quizContractAddress = contractAddress;

export { quizContract, quizContractAddress };

export async function addRewardsQuiz(amount = 0) {
    console.log(`🤖 Processing: Add Rewards Quiz`);
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
        console.log(`✅ Successfully added a quiz reward of ${amountRewardsFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while adding a quiz prize: ${getErrorMessage(error)}`);
    }
}

export async function joinQuiz(wallet) {
    console.log(`🤖 Processing: Quiz Participation`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const amount = ethers.utils.parseUnits('20', 18);
        const amountJoin = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountJoinFormatted = amountJoin.toLocaleString('en-US');

        const connectTokenWallet = tokenContract.connect(wallet);
        const connectWallet = contractInteraction.connect(wallet);

        const approveTransaction = await connectTokenWallet.approve(contractAddress, amount);
        await approveTransaction.wait();

        const transaction = await connectWallet.joinQuiz();
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Quiz Participation',
            `Joined the quiz challenge.`,
            amountJoin,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully participated in the quiz challenge at the cost of ${amountJoinFormatted} token`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when trying to join the quiz: ${getErrorMessage(error)}`);
    }
}

export async function submitAnswer(wallet, isCorrect = false) {
    const spinner = ora('Loading...').start();

    try {
        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.submitAnswer(isCorrect);
        await transaction.wait();
        spinner.stop();

        console.log(`✅ Successfully answered the quiz challenge questions`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while answering the quiz challenge: ${getErrorMessage(error)}`);
    }
}

export async function claimQuizRewards(wallet) {
    console.log(`🤖 Processing: Quiz Rewards Claim`);
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
                    amountRewards = parseFloat(ethers.utils.formatUnits(parsedLog.args.reward, 18));
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
            'Quiz Rewards Claim',
            `Claimed ${amountRewardsFormatted} tokens from the quiz reward.`,
            amountRewards,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully claimed ${amountRewardsFormatted} tokens earned from the quiz`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while claiming the quiz prize: ${getErrorMessage(error)}`);
    }
}
