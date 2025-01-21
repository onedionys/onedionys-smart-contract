import hre from 'hardhat';
import process from 'process';

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);

    // Deploy OneDionysToken
    const OneDionysToken = await hre.ethers.getContractFactory('OneDionysToken');
    const oneDionysToken = await OneDionysToken.deploy();
    console.log('OneDionysToken deployed to:', oneDionysToken.address);

    // Deploy Staking contract
    const Staking = await hre.ethers.getContractFactory('Staking');
    const staking = await Staking.deploy(oneDionysToken.address); // Use ODT token as reward
    console.log('Staking contract deployed to:', staking.address);

    // Deploy Quiz contract
    const Quiz = await hre.ethers.getContractFactory('Quiz');
    const quiz = await Quiz.deploy(oneDionysToken.address, deployer.address); // Use ODT and TEA token as reward
    console.log('Quiz contract deployed to:', quiz.address);

    // Deploy NFTCollection contract
    const NFTCollection = await hre.ethers.getContractFactory('NFTCollection');
    const nftCollection = await NFTCollection.deploy();
    console.log('NFTCollection contract deployed to:', nftCollection.address);

    // Deploy Lottery contract
    const Lottery = await hre.ethers.getContractFactory('Lottery');
    const lottery = await Lottery.deploy(oneDionysToken.address, nftCollection.address);
    console.log('Lottery contract deployed to:', lottery.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
