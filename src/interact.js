import { ethers } from 'ethers';
import process from 'process';
import delay from 'delay';
import ora from 'ora';
import {
    transferToken as tkTransferToken,
    claimFaucet as tkClaimFaucet,
    burnToken as tkBurnToken,
} from './contract/token.js';
import {
    setLotteryContract as ncSetLotteryContract,
    getNFTDetails as ncGetNFTDetails,
} from './contract/nftCollection.js';
import {
    addRewardsLottery as ltAddRewardsLottery,
    spinWheel as ltSpinWheel,
    getLeaderboard as ltGetLeaderboard,
    burnNft as ltBurnNft,
    withdraw as ltWithdraw,
} from './contract/lottery.js';
import {
    addRewardsStaking as stAddRewardsStaking,
    stake as stStake,
    unstake as stUnstake,
    withdraw as stWithdraw,
} from './contract/staking.js';
import {
    deposit as ntDeposit,
    getBalance as ntGetBalance,
    claimFaucet as ntClaimFaucet,
    donate as ntDonate,
    withdraw as ntWithdraw,
} from './contract/native.js';
import {
    addRewardsQuiz as qzAddRewardsQuiz,
    joinQuiz as qzJoinQuiz,
    submitAnswer as qzSubmitAnswer,
    claimQuizRewards as qzClaimQuizRewards,
} from './contract/quiz.js';
import {
    register as nsRegister,
    getName as nsGetName,
    getOwner as nsGetOwner,
    withdraw as nsWithdraw,
} from './contract/nameService.js';
import {
    addRewardsReferral as rfAddRewardsReferral,
    register as rfRegister,
    getLeaderboard as rfGetLeaderboard,
    getDetails as rfGetDetails,
    getUserDetails as rfGetUserDetails,
} from './contract/referral.js';
import {
    getDetails as tfGetDetails,
    updateFee as tfUpdateFee,
    createToken as tfCreateToken,
    withdraw as tfWithdraw,
} from './contract/tokenFactory.js';
import {
    addActivity as lbAddActivity,
    getUsers as lbGetUsers,
    getActivities as lbGetActivities,
} from './contract/leaderboard.js';

const activeProject = process.env.ACTIVE_PROJECT;
const rpcNetworkUrl = process.env[`RPC_URL_${activeProject.toUpperCase()}`];

const provider = new ethers.providers.JsonRpcProvider(rpcNetworkUrl);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const userWallet = new ethers.Wallet(process.env.USER_PRIVATE_KEY, provider);
const randomHash = ethers.utils.id(Math.random().toString());

// Token Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await tkTransferToken(userWallet, 1);
console.log(' ');
console.log('======================================');
console.log(' ');
await tkClaimFaucet(mainWallet);
console.log(' ');
console.log('======================================');
console.log(' ');
await tkBurnToken(mainWallet, 1);

// NFT Collection
console.log(' ');
console.log('======================================');
console.log(' ');
await ncSetLotteryContract();

// Lottery Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await ltAddRewardsLottery(1000);
console.log(' ');
console.log('======================================');
console.log(' ');
await ltSpinWheel(mainWallet);

// NFT Collection
console.log(' ');
console.log('======================================');
console.log(' ');
const nftDetails = await ncGetNFTDetails(0);
console.log(nftDetails);

// Lottery Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
const lotteryLeaderboard = await ltGetLeaderboard();
console.log(lotteryLeaderboard);
console.log(' ');
console.log('======================================');
console.log(' ');
await ltBurnNft(mainWallet, 0);
console.log(' ');
console.log('======================================');
console.log(' ');
const spinnerT1 = ora('Loading...').start();
await delay(65000);
spinnerT1.stop();
await ltSpinWheel(mainWallet);
console.log(' ');
console.log('======================================');
console.log(' ');
await ltWithdraw(mainWallet);

// Staking Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await stAddRewardsStaking(1000);
console.log(' ');
console.log('======================================');
console.log(' ');
await stStake(mainWallet, 1);
console.log(' ');
console.log('======================================');
console.log(' ');
await stUnstake(mainWallet, 1);
console.log(' ');
console.log('======================================');
console.log(' ');
await stStake(mainWallet, 1);
console.log(' ');
console.log('======================================');
console.log(' ');
const spinnerT2 = ora('Loading...').start();
await delay(65000);
spinnerT2.stop();
await stWithdraw(mainWallet);

// Native Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await ntDeposit(1);
console.log(' ');
console.log('======================================');
console.log(' ');
const nativeBalance = await ntGetBalance();
console.log(nativeBalance);
console.log(' ');
console.log('======================================');
console.log(' ');
await ntClaimFaucet(mainWallet);
console.log(' ');
console.log('======================================');
console.log(' ');
await ntDonate(mainWallet, 1);
console.log(' ');
console.log('======================================');
console.log(' ');
await ntWithdraw(nativeBalance);

// Quiz Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await qzAddRewardsQuiz(1000);
console.log(' ');
console.log('======================================');
console.log(' ');
await qzJoinQuiz(mainWallet);
console.log(' ');
console.log('======================================');
console.log(' ');
await qzSubmitAnswer(mainWallet, true);
console.log(' ');
console.log('======================================');
console.log(' ');
await qzClaimQuizRewards(mainWallet);

// Name Service Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await nsRegister(mainWallet, 'rexus');
console.log(' ');
console.log('======================================');
console.log(' ');
const nameServiceName = await nsGetName(mainWallet.address);
console.log(nameServiceName);
console.log(' ');
console.log('======================================');
console.log(' ');
const nameServiceOwner = await nsGetOwner('rexus');
console.log(nameServiceOwner);
console.log(' ');
console.log('======================================');
console.log(' ');
await nsWithdraw();

// Referral Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await rfAddRewardsReferral(1000);
console.log(' ');
console.log('======================================');
console.log(' ');
await rfRegister(mainWallet, ethers.constants.AddressZero);
console.log(' ');
console.log('======================================');
console.log(' ');
await rfRegister(userWallet, mainWallet.address);
console.log(' ');
console.log('======================================');
console.log(' ');
const referralLeaderboard = await rfGetLeaderboard();
console.log(referralLeaderboard);
console.log(' ');
console.log('======================================');
console.log(' ');
const referralDetails = await rfGetDetails(mainWallet);
console.log(referralDetails);
console.log(' ');
console.log('======================================');
console.log(' ');
const referralUser = await rfGetUserDetails(mainWallet);
console.log(referralUser);

// Token Factory Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
const tokenFactoryDetails = await tfGetDetails();
console.log(tokenFactoryDetails);
console.log(' ');
console.log('======================================');
console.log(' ');
await tfUpdateFee(10); // 10, 1.5, & 1
console.log(' ');
console.log('======================================');
console.log(' ');
await tfCreateToken(mainWallet, 'Rexus Token', 'RXS', 1000000);
console.log(' ');
console.log('======================================');
console.log(' ');
await tfWithdraw();

// Leaderboard Interaction
console.log(' ');
console.log('======================================');
console.log(' ');
await lbAddActivity(mainWallet.address, 'Token Burn', 'Burned 10 tokens.', 10, randomHash);
console.log(' ');
console.log('======================================');
console.log(' ');
const leaderboardUsers = await lbGetUsers();
console.log(leaderboardUsers);
console.log(' ');
console.log('======================================');
console.log(' ');
const leaderboardActivities = await lbGetActivities(mainWallet.address);
console.log(leaderboardActivities);
