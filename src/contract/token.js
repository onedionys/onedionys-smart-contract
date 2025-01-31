import { ethers } from 'ethers';
import process from 'process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import ora from 'ora';

const getABI = (toPath = '') => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, `./artifacts/contracts/${toPath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return JSON.parse(fileContent);
};

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const contractJson = getABI('Token.sol/Token.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const leaderboardAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;
const leaderboardJson = getABI('Leaderboard.sol/Leaderboard.json');
const leaderboardAbi = leaderboardJson.abi;
const leaderboardInteraction = new ethers.Contract(leaderboardAddress, leaderboardAbi, mainWallet);

export async function transferTea(wallet, amount = 0) {
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        amount = ethers.utils.parseUnits(amount.toString(), 18);
        const amountTransfer = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountFormattedString = amountTransfer.toLocaleString('en-US');

        const transaction = await mainWallet.sendTransaction({
            to: wallet.address,
            value: amount,
        });
        const receipt = await transaction.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully transferred ${amountFormattedString} tokens to address ${wallet.address}`);
    } catch (error) {
        spinner.stop();

        let errorMessage = 'An unknown error occurred';

        if (error?.error?.reason) {
            let reason = error.error.reason;
            reason = reason.split(': ').pop();
            errorMessage = `${error.error.code} - ${reason}`;
        }

        console.log(`❌ An error occurred during the token transfer: ${errorMessage}`);
    }
}

export async function claimFaucet(wallet) {
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface(['event FaucetClaimed(address indexed claimer, uint256 amount)']);

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.claimFaucet();
        const receipt = await transaction.wait();

        const amountClaimed = receipt.logs.reduce((total, log) => {
            try {
                const parsedLog = iface.parseLog(log);
                return parsedLog?.name === 'FaucetClaimed' && parsedLog.args?.amount
                    ? parseFloat(ethers.utils.formatUnits(parsedLog.args.amount, 18))
                    : parseFloat(total);
            } catch {
                return parseFloat(total);
            }
        }, 0);

        const amountFormattedString = amountClaimed.toLocaleString('en-US');

        const activity = await leaderboardInteraction.addActivity(
            wallet.address,
            'Faucet Claim',
            `Claimed ${amountFormattedString} tokens from the faucet.`,
            amountClaimed,
            receipt.transactionHash,
        );
        await activity.wait();
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully claim faucet for address ${wallet.address}`);
    } catch (error) {
        spinner.stop();

        let errorMessage = 'An unknown error occurred';

        if (error?.error?.reason) {
            let reason = error.error.reason;
            reason = reason.split(': ').pop();
            errorMessage = `${error.error.code} - ${reason}`;
        }

        console.log(`❌ An error occurred while claiming the faucet: ${errorMessage}`);
    }
}
