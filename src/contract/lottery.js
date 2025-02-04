import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';
import { tokenContract } from './token.js';
import { nftCollectionContract /* , setLotteryContract */ } from './nftCollection.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
const contractJson = getJsonABI('Lottery.sol/Lottery.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

const lotteryContract = contractInteraction;
const lotteryContractAddress = contractAddress;

export { lotteryContract, lotteryContractAddress };

export async function addRewardsLottery(amount = 0) {
    console.log(`🤖 Processing: Add Rewards Lottery`);
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
        console.log(`✅ Successfully added a lottery prize of ${amountRewardsFormatted} tokens`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while adding a lottery prize: ${getErrorMessage(error)}`);
    }
}

export async function spinWheel(wallet) {
    console.log(`🤖 Processing: Spin the Wheel`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface([
            'event SpinWheel(address indexed user, string rarity, uint256 points, string cid)',
        ]);

        const amount = ethers.utils.parseUnits('1', 18);
        const amountSpin = parseFloat(ethers.utils.formatUnits(amount, 18));
        const amountSpinFormatted = amountSpin.toLocaleString('en-US');

        const connectTokenWallet = tokenContract.connect(wallet);
        const connectWallet = contractInteraction.connect(wallet);

        const approveTransaction = await connectTokenWallet.approve(contractAddress, amount);
        await approveTransaction.wait();

        const transaction = await connectWallet.spinWheel();
        const receipt = await transaction.wait();

        let amountPoints = 0;
        let rarityNft = 'Unknown';

        receipt.logs.some((log) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog.name === 'SpinWheel') {
                    amountPoints = parseFloat(parsedLog.args.points);
                    rarityNft = parsedLog.args.rarity;
                    return true;
                }
            } catch (e) {
                void e;
            }
            return false;
        });

        const amountPointsFormatted = amountPoints.toLocaleString('en-US');

        await addActivity(
            wallet.address,
            'Spin the Wheel',
            `Spin the wheel and win 1 ${rarityNft} NFT, worth ${amountPointsFormatted} tokens.`,
            amountSpin,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(
            `✅ Successfully spin the wheel and won 1 ${rarityNft} NFT (worth ${amountPointsFormatted}), costing ${amountSpinFormatted} tokens`,
        );
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while turning the wheel: ${getErrorMessage(error)}`);
    }
}

export async function getLeaderboard() {
    const spinner = ora('Loading...').start();

    try {
        const [addresses, points] = await contractInteraction.getLeaderboard();
        const leaderboard = addresses.map((addr, index) => ({
            address: addr,
            points: points[index].toNumber(),
        }));

        spinner.stop();
        return leaderboard;
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while getting the leaderboard list: ${getErrorMessage(error)}`);
        return [];
    }
}

export async function burnNft(wallet, tokenId = 0) {
    console.log(`🤖 Processing: NFT Burn`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const connectWallet = contractInteraction.connect(wallet);

        const [rarity, points] = await nftCollectionContract.getNFTDetails(tokenId);
        const transaction = await connectWallet.burnNft(tokenId);
        const receipt = await transaction.wait();

        let amountPoints = points.toNumber();

        await addActivity(
            wallet.address,
            'NFT Burn',
            `Burned 1 ${rarity} NFT and get ${amountPoints} tokens.`,
            amountPoints,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully burned 1 ${rarity} NFT with ID ${tokenId}`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while burning the NFT: ${getErrorMessage(error)}`);
    }
}

export async function withdraw(wallet) {
    console.log(`🤖 Processing: Spin Rewards Withdrawal`);
    console.log(`⏳ Current Time: ${new Date().toString()}`);
    const spinner = ora('Loading...').start();

    try {
        const iface = new ethers.utils.Interface(['event Withdraw(address indexed user, uint256 points)']);

        const connectWallet = contractInteraction.connect(wallet);

        const transaction = await connectWallet.withdrawTokens();
        const receipt = await transaction.wait();

        let amountPoints = 0;

        receipt.logs.some((log) => {
            try {
                const parsedLog = iface.parseLog(log);
                if (parsedLog.name === 'Withdraw') {
                    amountPoints = parseFloat(parsedLog.args.points);
                    return true;
                }
            } catch (e) {
                void e;
            }
            return false;
        });

        const amountPointsFormatted = amountPoints.toLocaleString('en-US');

        await addActivity(
            wallet.address,
            'Spin Rewards Withdrawal',
            `Claimed ${amountPointsFormatted} tokens from the prize spin wheel.`,
            amountPoints,
            receipt.transactionHash,
        );
        spinner.stop();

        console.log(`🧾 Transaction URL: ${process.env.BLOCK_EXPLORER_URL}tx/${receipt.transactionHash}`);
        console.log(`✅ Successfully withdrawn all tokens (${amountPointsFormatted}) won from the lottery`);
    } catch (error) {
        spinner.stop();
        console.log(`❌ An error occurred while withdrawing all tokens: ${getErrorMessage(error)}`);
    }
}

// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await setLotteryContract();
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await addRewardsLottery(1000);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await spinWheel(mainWallet);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// const leaderboard = await getLeaderboard();
// console.log(leaderboard);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await burnNft(mainWallet, 1);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
// await withdraw(mainWallet);
// console.log(" ");
// console.log("======================================");
// console.log(" ");
