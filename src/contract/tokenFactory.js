import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.TOKEN_FACTORY_CONTRACT_ADDRESS;
const contractJson = getJsonABI('TokenFactory.sol/TokenFactory.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

async function getTokenFactoryDetails() {
    const currentFee = await tokenFactoryContract.fee();
    const ownerAddress = await tokenFactoryContract.owner();
    console.log(`Current Fee: ${ethers.utils.formatUnits(currentFee, 18)} TEA`);
    console.log(`Contract Owner: ${ownerAddress}`);
}

async function updateFactoryFee(newFee) {
    const feeAmount = ethers.utils.parseUnits(newFee.toString(), 18);
    const tx = await tokenFactoryContract.updateFee(feeAmount);
    await tx.wait();
    console.log(`Updated factory fee to ${newFee} TEA`);
}

async function createToken(wallet, name, symbol, totalSupply) {
    const iface = new ethers.utils.Interface([
        'event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply)',
    ]);
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await tokenFactoryContract.connect(walletInstance).createToken(name, symbol, totalSupply, {
        value: ethers.utils.parseUnits('10', 18),
    });
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await leaderboardContract.addActivity(
        wallet.address,
        'Create Token',
        'Users create token',
        1000,
        txHash,
    );
    await addActivityTx.wait();

    for (const log of receipt.logs) {
        try {
            const parsedLog = iface.parseLog(log);
            if (typeof parsedLog.args[0] != 'undefined') {
                console.log(
                    `Token Created: ${parsedLog.args.name} (${parsedLog.args.symbol}) - ${parsedLog.args.totalSupply.toString()}`,
                );
                console.log(`Token Address: ${parsedLog.args.tokenAddress}`);
            }
        } catch (e) {
            void e;
        }
    }
}

async function withdrawFees() {
    const tx = await tokenFactoryContract.withdrawFees();
    await tx.wait();
    console.log('Withdrawn all fees');
}
