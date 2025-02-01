import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.QUIZ_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Quiz.sol/Quiz.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

async function joinQuiz(wallet) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const amount = ethers.utils.parseUnits('15', 18);

    const approveTx = await tokenContract.connect(walletInstance).approve(quizContractAddress, amount);
    await approveTx.wait();

    const tx = await quizContract.connect(walletInstance).joinQuiz();
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Join Quiz',
        'Users join quiz',
        amount,
        txHash,
    );
    await addActivityTx.wait();
    console.log(`Wallet ${wallet.address} successfully joined the quiz.`);
}

async function submitAnswer(wallet, isCorrect) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await quizContract.connect(walletInstance).submitAnswer(isCorrect);
    await tx.wait();
    console.log(`Wallet ${wallet.address} submitted answer: ${isCorrect ? 'Correct' : 'Incorrect'}.`);
}

async function claimQuizRewards(wallet) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await quizContract.connect(walletInstance).claimRewards();
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Claim Quiz Rewards',
        'Users claim quiz rewards',
        1000,
        txHash,
    );
    await addActivityTx.wait();
    console.log(`Wallet ${wallet.address} successfully claimed rewards.`);
}

async function addRewardTokensQuiz(amount) {
    const rewardAmount = ethers.utils.parseUnits(amount.toString(), 18);

    const approveTx = await tokenContract.approve(quizContractAddress, rewardAmount);
    await approveTx.wait();
    console.log(`Approved ${amount} token for reward pool.`);

    const addRewardTx = await quizContract.addRewardTokens(rewardAmount);
    await addRewardTx.wait();
    console.log(`Added ${amount} token as reward tokens.`);
}
