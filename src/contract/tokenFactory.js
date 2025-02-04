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
    console.log(`🤖 Processing: Token Creation`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface([
            'event TokenCreated(address indexed tokenAddress, string name, string symbol, uint256 totalSupply)',
        ]);

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.createToken(name, symbol, totalSupply, {
            value: ethers.utils.parseUnits('1', 18),
        });
        const receipt = await transaction.wait();

        let tokenAddress = 'Unknown';

        receipt.logs.some((log) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog.name === 'TokenCreated') {
                    tokenAddress = parsedLog.args.tokenAddress;
                    return true;
                }
            } catch (e) {
                void e;
            }
            return false;
        });

        await addActivity(
            wallet.address,
            'Token Creation',
            `Create a new token (${symbol}) with ${totalSupply} supply.`,
            1,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(
            `✅ Successfully create a token with address ${tokenAddress}`,
        );
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while creating the token: ${getErrorMessage(error)}`);
    }
}

export async function withdraw() {
    console.log(`🤖 Processing: Token Factory Withdrawal`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const transaction = await contractInteraction.withdrawFees();
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully withdraw all tokens from the token factory contract`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while withdrawing tokens: ${getErrorMessage(error)}`);
    }
}

console.log(" ");
console.log("======================================");
console.log(" ");
const details = await getDetails();
console.log(details);
console.log(" ");
console.log("======================================");
console.log(" ");
await updateFee(1);
console.log(" ");
console.log("======================================");
console.log(" ");
await createToken(mainWallet, 'Sajaddah Token', 'SJD', 1000);
console.log(" ");
console.log("======================================");
console.log(" ");
await withdraw();
console.log(" ");
console.log("======================================");
console.log(" ");