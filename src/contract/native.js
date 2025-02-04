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

export async function deposit(amount) {
    console.log(`🤖 Processing: Deposit Native Token`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountPool = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountPoolFormatted = amountPool.toLocaleString('en-US');

        const transaction = await contractInteraction.depositNative({
            value: amount
        });
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully deposited ${amountPoolFormatted} tokens as a reward.`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while depositing tokens: ${getErrorMessage(error)}`);
    }
}

export async function getBalance() {
    const spinner = ora('Loading...').start();

    try {
        const amount = await contractInteraction.getContractBalance();
        const amountPool = parseFloat(ethers.utils.formatEther(amount));
        spinner.stop();

        return amountPool || 0;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the contract balance: ${getErrorMessage(error)}`);
        return 0;
    }
}

export async function claimFaucet(wallet) {
    console.log(`🤖 Processing: Faucet Claim Native`);
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
            'Faucet Claim Native',
            `Claimed ${amountClaimedFormatted} tokens from the faucet native.`,
            amountClaimed,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully claim faucet for address ${wallet.address}`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while claiming the faucet native: ${getErrorMessage(error)}`);
    }
}

export async function donate(wallet, amount) {
    console.log(`🤖 Processing: Donate Native Token`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountDonated = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountDonatedFormatted = amountDonated.toLocaleString('en-US');

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.donate({
            value: amount
        });
        const receipt = await transaction.wait();

        await addActivity(
            wallet.address,
            'Donate Native Token',
            `Donate ${amountDonatedFormatted} tokens to the native contract.`,
            amountDonated,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully donated ${amountDonatedFormatted} tokens to a native contract.`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while making a token donation: ${getErrorMessage(error)}`);
    }
}

export async function withdraw(amount) {
    console.log(`🤖 Processing: Native Withdrawal`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountWithdrawal = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountWithdrawalFormatted = amountWithdrawal.toLocaleString('en-US');

        const transaction = await contractInteraction.withdrawNative(amount);
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully withdraw ${amountWithdrawalFormatted} tokens from the native contract`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while withdrawing tokens: ${getErrorMessage(error)}`);
    }
}

// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await deposit(1);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// const balance = await getBalance();
// console.log(balance);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await claimFaucet(mainWallet);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await donate(mainWallet, 1);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await withdraw(balance);
// console.log(" ");
// console.log("======================================");
// console.log(" ");