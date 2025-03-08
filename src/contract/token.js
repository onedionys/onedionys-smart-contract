import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const activeProject = process.env.ACTIVE_PROJECT;
const rpcNetworkUrl = process.env[`RPC_URL_${activeProject.toUpperCase()}`];
const blockExplorerUrl = process.env[`BLOCK_EXPLORER_URL_${activeProject.toUpperCase()}`];

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env[`TOKEN_CONTRACT_ADDRESS_${activeProject.toUpperCase()}`];
const contractJson = getJsonABI('Token.sol/Token.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const tokenContract = contractInteraction;
const tokenContractAddress = contractAddress;

export { tokenContract, tokenContractAddress };

export async function transferToken(wallet, amount = 0) {
    console.log(`🤖 Processing: Transfer Token`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountTransfer = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountTransferFormatted = amountTransfer.toLocaleString('en-US');

        const transaction = await mainWallet.sendTransaction({
            to: wallet.address,
            value: amount,
        });
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully transferred ${amountTransferFormatted} tokens to address ${wallet.address}`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred during the token transfer: ${getErrorMessage(error)}`);
    }
}

export async function claimFaucet(wallet) {
    console.log(`🤖 Processing: Faucet Claim`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface(['event FaucetClaimed(address indexed claimer, uint256 amount)']);

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.claimFaucet();
        const receipt = await transaction.wait();

        let amountClaimed = 0;

        receipt.logs.some((log) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog.name === 'FaucetClaimed') {
                    amountClaimed = parseFloat(ethers.utils.formatUnits(parsedLog.args.amount, 18));
                    return true;
                }
            } catch (e) {
                void e;
            }
            return false;
        });

        const amountClaimedFormatted = amountClaimed.toLocaleString('en-US');

        await addActivity(
            wallet.address,
            'Faucet Claim',
            `Claimed ${amountClaimedFormatted} tokens from the faucet.`,
            amountClaimed,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully claim faucet for address ${wallet.address}`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while claiming the faucet: ${getErrorMessage(error)}`);
    }
}

export async function burnToken(wallet, amount = 0) {
    console.log(`🤖 Processing: Token Burn`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountBurned = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountBurnedFormatted = amountBurned.toLocaleString('en-US');

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.burn(amount);
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Token Burn',
            `Burned ${amountBurnedFormatted} tokens.`,
            amountBurned,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${blockExplorerUrl}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully burn ${amountBurnedFormatted} tokens from address ${wallet.address}`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while burning the token: ${getErrorMessage(error)}`);
    }
}
