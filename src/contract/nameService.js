import { ethers } from 'ethers';
import process from 'process';
import ora from 'ora';
import { getErrorMessage, getJsonABI } from './../utils.js';
import { addActivity } from './leaderboard.js';

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const mainWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractAddress = process.env.NAME_SERVICE_CONTRACT_ADDRESS;
const contractJson = getJsonABI('NameService.sol/NameService.json');
const contractAbi = contractJson.abi;
const contractInteraction = new ethers.Contract(contractAddress, contractAbi, mainWallet);

async function nameServiceRegister(wallet, name) {
    const walletInstance = new ethers.Wallet(wallet.privateKey, provider);

    const tx = await nameServiceContract.connect(walletInstance).registerName(name, {
        value: ethers.utils.parseUnits('20', 18),
    });
    await tx.wait();
    console.log('User registered successfully!');
}

async function nameServiceGetName(address) {
    const name = await nameServiceContract.getName(address);
    if (name === '') {
        console.log(`No name registered for address: ${address}`);
    } else {
        console.log(`Name registered for address ${address}: ${name}`);
    }
}

async function nameServiceGetOwner(name) {
    const owner = await nameServiceContract.getOwner(name);
    if (owner === '') {
        console.log(`No owner registered for name: ${name}`);
    } else {
        console.log(`Owner registered for name ${name}: ${owner}`);
    }
}

async function nameServiceWithdraw() {
    const tx = await nameServiceContract.withdrawFunds();
    console.log('Transaction sent:', tx.hash);
    await tx.wait();
}
