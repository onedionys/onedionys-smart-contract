import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';
import { tokenContract } from './token.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);

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
        console.log(`✅ Successfully added a lottery prize of ${amountRewardsFormatted} tokens.`);
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

        const amount = ethers.utils.parseUnits('10', 18);
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
        console.log(`✅ Successfully spin the wheel and won 1 ${rarityNft} NFT, costing ${amountSpinFormatted} tokens.`);
    } catch (error) {
        spinner.stop();
        console.log(error);
        console.log(`❌ An error occurred while turning the wheel: ${getErrorMessage(error)}`);
    }
}

// await addRewardsLottery(1000);
await spinWheel(userWallet);

// async function spinWheel(wallet) {
//     const iface = new ethers.utils.Interface([
//         'event SpinWheel(address indexed user, string rarity, uint256 points, string cid)',
//     ]);
//     const walletInstance = new ethers.Wallet(wallet.privateKey, provider);
//     const amount = ethers.utils.parseUnits('10', 18);

//     const approveTx = await tokenContract.connect(walletInstance).approve(lotteryContractAddress, amount);
//     await approveTx.wait();

//     const tx = await lotteryContract.connect(walletInstance).spinWheel();
//     const receipt = await tx.wait();
//     const txHash = receipt.transactionHash;

//     const addActivityTx = await leaderboardContract.addActivity(
//         wallet.address,
//         'Spin Wheel',
//         'Users spin wheel',
//         500,
//         txHash,
//     );
//     await addActivityTx.wait();

//     for (const log of receipt.logs) {
//         try {
//             const parsedLog = iface.parseLog(log);
//             if (typeof parsedLog.args[0] != 'undefined') {
//                 console.log(
//                     `Spin completed, ${parsedLog.args.user} gets an NFT ${parsedLog.args.rarity} with ${parsedLog.args.points.toNumber()} points!`,
//                 );
//             }
//         } catch (e) {
//             void e;
//         }
//     }
// }

// await spinWheel(mainWallet);
// await addRewardsLottery(1000);

// async function getLeaderboard() {
//     const [addresses, points] = await lotteryContract.getLeaderboard();
//     console.log('Leaderboard:');
//     addresses.forEach((addr, index) => {
//         console.log(`${index + 1}. ${addr} - ${points[index]} points`);
//     });
// }

// async function withdrawTokens(wallet) {
//     const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

//     const tx = await lotteryContract.connect(walletInstance).withdrawTokens();
//     const receipt = await tx.wait();
//     const txHash = receipt.transactionHash;

//     const addActivityTx = await leaderboardContract.addActivity(
//         wallet.address,
//         'Withdraw Token',
//         'Users withdraw token',
//         1000,
//         txHash,
//     );
//     await addActivityTx.wait();
//     console.log('Tokens successfully withdrawn from the lottery contract!');
// }



// async function burnNft(wallet, tokenId) {
//     const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

//     const tx = await lotteryContract.connect(walletInstance).burnNft(tokenId);
//     const receipt = await tx.wait();
//     const txHash = receipt.transactionHash;

//     const addActivityTx = await leaderboardContract.addActivity(
//         wallet.address,
//         'Burn NFT',
//         'Users burn nft',
//         1000,
//         txHash,
//     );
//     await addActivityTx.wait();
//     console.log(`NFT with Token ID ${tokenId} has been burned.`);
// }
