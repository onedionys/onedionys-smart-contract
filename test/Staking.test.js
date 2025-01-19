import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Staking Contract', function () {
    let owner, user1, user2;
    let staking, odtToken, teaToken;

    // Setup untuk sebelum setiap test
    beforeEach(async function () {
        // Mendapatkan akun
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy token ODT (ERC20 token)
        const ODTToken = await ethers.getContractFactory('OneDionysToken');
        odtToken = await ODTToken.deploy();
        await odtToken.deployed();

        // Ambil kontrak TEA dari wallet utama (owner.address)
        teaToken = await ethers.getContractAt('IERC20', owner.address); // Wallet utama memegang TEA

        // Deploy kontrak Staking
        const Staking = await ethers.getContractFactory('Staking');
        staking = await Staking.deploy(odtToken.address, owner.address); // Menggunakan address wallet utama untuk TEA
        await staking.deployed();

        // Mint token untuk user dan owner
        await odtToken.mint(user1.address, ethers.utils.parseEther('100'));
        await odtToken.mint(user2.address, ethers.utils.parseEther('100'));

        // Pastikan ada cukup TEA di wallet untuk reward
        const teaAmount = ethers.utils.parseEther('1000');
        await teaToken.transfer(staking.address, teaAmount); // Transfer TEA dari wallet utama ke kontrak staking
    });

    describe('Stake', function () {
        it('Should allow users to stake ODT tokens', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('100'));
            await staking.connect(user1).stake(ethers.utils.parseEther('100'));

            const stakedAmount = await staking.stakedAmounts(user1.address);
            expect(stakedAmount.toString()).to.equal(ethers.utils.parseEther('100').toString());
        });

        it('Should revert if staking amount is 0', async function () {
            await expect(staking.connect(user1).stake(0)).to.be.rejectedWith('Amount should be greater than 0');
        });
    });

    describe('Unstake', function () {
        it('Should allow users to unstake tokens', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('100'));
            await staking.connect(user1).stake(ethers.utils.parseEther('100'));

            await staking.connect(user1).unstake(ethers.utils.parseEther('50'));

            const stakedAmount = await staking.stakedAmounts(user1.address);
            expect(stakedAmount.toString()).to.equal(ethers.utils.parseEther('50').toString());
        });

        it('Should revert if user tries to unstake more than staked amount', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('100'));
            await staking.connect(user1).stake(ethers.utils.parseEther('100'));

            await expect(staking.connect(user1).unstake(ethers.utils.parseEther('200'))).to.be.rejectedWith(
                'Not enough staked',
            );
        });
    });

    describe('Claim Rewards', function () {
        it('Should allow users to claim rewards after staking', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('100'));
            await staking.connect(user1).stake(ethers.utils.parseEther('100'));

            // Fast forward time by 1 day
            await ethers.provider.send('evm_increaseTime', [86400]); // 86400 seconds = 1 day
            await ethers.provider.send('evm_mine', []);

            await staking.connect(user1).claimRewards();

            const userBalance = await teaToken.balanceOf(user1.address);
            expect(userBalance).to.be.gt(0); // Pastikan user menerima reward
        });

        it('Should revert if no tokens are staked', async function () {
            await expect(staking.connect(user2).claimRewards()).to.be.rejectedWith('No tokens staked');
        });

        it('Should revert if not enough reward tokens in contract', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('100'));
            await staking.connect(user1).stake(ethers.utils.parseEther('100'));

            // Set reward tokens to 0
            await teaToken.transfer(staking.address, ethers.utils.parseEther('0'));

            await expect(staking.connect(user1).claimRewards()).to.be.rejectedWith(
                'Not enough TEA in contract for rewards',
            );
        });
    });

    describe('Add Reward Tokens', function () {
        it('Should allow owner to add reward tokens', async function () {
            await teaToken.connect(owner).approve(staking.address, ethers.utils.parseEther('1000'));
            await staking.connect(owner).addRewardTokens(ethers.utils.parseEther('1000'));

            const contractBalance = await teaToken.balanceOf(staking.address);
            expect(contractBalance).to.equal(ethers.utils.parseEther('10000').add(ethers.utils.parseEther('1000')));
        });

        it('Should revert if non-owner tries to add reward tokens', async function () {
            await expect(staking.connect(user1).addRewardTokens(ethers.utils.parseEther('1000'))).to.be.rejectedWith(
                'Ownable: caller is not the owner',
            );
        });
    });

    describe('Set Reward Per Second', function () {
        it('Should allow owner to set reward per second', async function () {
            await staking.connect(owner).setRewardPerSecond(ethers.utils.parseEther('0.0001'));

            const rewardPerSecond = await staking.rewardPerSecond();
            expect(rewardPerSecond.toString()).to.equal(ethers.utils.parseEther('0.0001').toString());
        });

        it('Should revert if non-owner tries to set reward per second', async function () {
            await expect(
                staking.connect(user1).setRewardPerSecond(ethers.utils.parseEther('0.0001')),
            ).to.be.rejectedWith('Ownable: caller is not the owner');
        });
    });
});
