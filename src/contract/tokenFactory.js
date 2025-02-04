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

const tokenFactoryContract = contractInteraction;
const tokenFactoryContractAddress = contractAddress;

export { tokenFactoryContract, tokenFactoryContractAddress };

export async function getDetails() {
    const spinner = ora('Loading...').start();

    try {
        const fee = await contractInteraction.fee();
        const owner = await contractInteraction.owner();

        spinner.stop();
        if(typeof fee != "undefined" && typeof owner != "undefined") {
            return {
                fee: parseFloat(ethers.utils.formatUnits(fee, 18)),
                owner: owner
            }
        }else {
            return null;
        }
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the contract details: ${getErrorMessage(error)}`);
        return null;
    }
}

export async function updateFee(amount = 0) {
    console.log(`🤖 Processing: Update Fee`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountFee = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountFeeFormatted = amountFee.toLocaleString('en-US');

        const transaction = await contractInteraction.updateFee(amount);
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully converted the fee into ${amountFeeFormatted} tokens.`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred when changing the fee: ${getErrorMessage(error)}`);
    }
}

export async function createToken(wallet, name = '', symbol = '', totalSupply = 0) {
    const iface = new ethers.utils.Interface([
        'event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply)',
    ]);
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await contractInteraction.connect(walletInstance).createToken(name, symbol, totalSupply, {
        value: ethers.utils.parseUnits('10', 18),
    });
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;

    const addActivityTx = await addActivity(
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

export async function withdraw() {
    const tx = await contractInteraction.withdrawFees();
    await tx.wait();
    console.log('Withdrawn all fees');
}

const details = await getDetails();
console.log(details);
await updateFee(1);