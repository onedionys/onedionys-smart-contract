import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const activeProject = process.env.ACTIVE_PROJECT;

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL_REDDIO);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.NAME_SERVICE_CONTRACT_ADDRESS;
const contractJson = getJsonABI('NameService.sol/NameService.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const nameServiceContract = contractInteraction;
const nameServiceContractAddress = contractAddress;

export { nameServiceContract, nameServiceContractAddress };

export async function register(wallet, name = '') {
    console.log(`🤖 Processing: Name Service Registration`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const amount = ethers.utils.parseUnits('20', 18);
        const amountFee = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountFeeFormatted = amountFee.toLocaleString('en-US');

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.registerName(name, {
            value: amount,
        });
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Name Service Registration',
            `Register a name service (${name}.chai) for ${amountFeeFormatted} tokens.`,
            amountFee,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL_REDDIO}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully registered a name service with the name ${name}.chai`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while registering the name service: ${getErrorMessage(error)}`);
    }
}

export async function getName(address = '') {
    const spinner = ora('Loading...').start();

    try {
        const name = await contractInteraction.getName(address);
        spinner.stop();

        return name === '' ? null : name;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the users service name: ${getErrorMessage(error)}`);
        return null;
    }
}

export async function getOwner(name = '') {
    const spinner = ora('Loading...').start();

    try {
        const owner = await contractInteraction.getOwner(name);
        spinner.stop();

        return owner === '' ? null : owner;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the users service name: ${getErrorMessage(error)}`);
        return null;
    }
}

export async function withdraw() {
    console.log(`🤖 Processing: Name Service Withdrawal`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const transaction = await contractInteraction.withdrawFunds();
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL_REDDIO}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully withdraw all tokens from the name service contract`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while withdrawing all tokens: ${getErrorMessage(error)}`);
    }
}
