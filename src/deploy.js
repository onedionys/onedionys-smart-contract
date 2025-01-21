import hre from 'hardhat';
import process from 'process';

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);

    const OneDionysToken = await hre.ethers.getContractFactory('OneDionysToken');
    const oneDionysToken = await OneDionysToken.deploy();
    console.log('OneDionysToken deployed to:', oneDionysToken.address);

    const Staking = await hre.ethers.getContractFactory('Staking');
    const staking = await Staking.deploy(oneDionysToken.address);
    console.log('Staking contract deployed to:', staking.address);

    const Quiz = await hre.ethers.getContractFactory('Quiz');
    const quiz = await Quiz.deploy(oneDionysToken.address);
    console.log('Quiz contract deployed to:', quiz.address);

    const NFTCollection = await hre.ethers.getContractFactory('NFTCollection');
    const nftCollection = await NFTCollection.deploy();
    console.log('NFTCollection contract deployed to:', nftCollection.address);

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
