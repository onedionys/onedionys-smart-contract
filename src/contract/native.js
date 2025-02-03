import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.NATIVE_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Native.sol/Native.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const nativeContract = contractInteraction;
const nativeContractAddress = contractAddress;

export { nativeContract, nativeContractAddress };

async function depositNativeToken(amount) {
    const poolAmount = ethers.utils.parseEther(amount.toString());

    const addRewardTx = await nativeContract.depositNative({
        value: poolAmount,
    });
    await addRewardTx.wait();
    console.log(`Deposit ${amount} token as reward tokens.`);
}

async function withdrawNativeToken(amount) {
    const poolAmount = ethers.utils.parseEther(amount.toString());

    const addRewardTx = await nativeContract.withdrawNative(poolAmount);
    await addRewardTx.wait();
    console.log(`Withdraw ${amount} token as reward tokens.`);
}

async function getContractBalanceNativeToken() {
    const addRewardTx = await nativeContract.getContractBalance();
    console.log(`Contract balance. ${ethers.utils.formatEther(addRewardTx)}`);
}

async function claimFaucetNativeToken(wallet) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await nativeContract.connect(walletInstance).claimFaucet();
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Claim Native Faucet',
        'Users claim native faucet',
        1000,
        txHash,
    );
    await addActivityTx.wait();
    console.log(`Succeess claim native token.`);
}

async function donateNativeToken(wallet, amount) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
    const stakeAmount = ethers.utils.parseEther(amount.toString());

    const unstakingTx = await nativeContract.connect(walletInstance).donate({
        value: stakeAmount,
    });
    const receipt = await unstakingTx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(wallet.address, 'Donate', 'Users donate', 1000, txHash);
    await addActivityTx.wait();
    console.log(`Succeess donate native token.`);
}
