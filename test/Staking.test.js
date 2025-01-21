import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Staking Contract', function () {
    let owner, user1, user2;
    let staking, odtToken;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const ODTToken = await ethers.getContractFactory('OneDionysToken');
        odtToken = await ODTToken.deploy();
        await odtToken.deployed();

        const Staking = await ethers.getContractFactory('Staking');
        staking = await Staking.deploy(odtToken.address);
        await staking.deployed();

        await odtToken.mint(user1.address, ethers.utils.parseEther('100'));
        await odtToken.mint(user2.address, ethers.utils.parseEther('100'));

        const rewardAmount = ethers.utils.parseEther('500000');
        await odtToken.mint(owner.address, rewardAmount);
        await odtToken.approve(staking.address, rewardAmount);
        await staking.addRewardTokens(rewardAmount);
    });

    describe('Stake', function () {
        it('Should allow users to stake tokens', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('50'));
            await staking.connect(user1).stake(ethers.utils.parseEther('50'));

            const stakedAmount = await staking.stakedAmounts(user1.address);
            expect(stakedAmount.toString()).to.equal(ethers.utils.parseEther('50').toString());
        });

        it('Should reject staking with 0 tokens', async function () {
            await expect(staking.connect(user1).stake(0)).to.be.rejectedWith('Amount should be greater than 0');
        });
    });

    describe('Unstake', function () {
        it('Should allow users to unstake tokens', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('50'));
            await staking.connect(user1).stake(ethers.utils.parseEther('50'));
            await staking.connect(user1).unstake(ethers.utils.parseEther('20'));

            const stakedAmount = await staking.stakedAmounts(user1.address);
            expect(stakedAmount.toString()).to.equal(ethers.utils.parseEther('30').toString());
        });

        it('Should reject unstaking more than staked amount', async function () {
            await odtToken.connect(user1).approve(staking.address, ethers.utils.parseEther('50'));
            await staking.connect(user1).stake(ethers.utils.parseEther('50'));

            await expect(staking.connect(user1).unstake(ethers.utils.parseEther('100'))).to.be.rejectedWith(
                'Not enough staked',
            );
        });
    });

    describe('Claim Rewards', function () {
        it('Should allow users to claim rewards', async function () {
            const stakingAmount = ethers.utils.parseEther('100');
            const rewardPerSecond = ethers.utils.parseEther('0.00001');
            const durationInSeconds = 86400;
            const delta = ethers.BigNumber.from('1000000000000000');

            await odtToken.connect(user1).approve(staking.address, stakingAmount);
            await staking.connect(user1).stake(stakingAmount);
            await ethers.provider.send('evm_increaseTime', [durationInSeconds]);
            await ethers.provider.send('evm_mine');
            await staking.connect(user1).claimRewards();

            const expectedReward = rewardPerSecond
                .mul(stakingAmount)
                .mul(durationInSeconds)
                .div(ethers.constants.WeiPerEther);
            const userBalance = await odtToken.balanceOf(user1.address);

            const difference = userBalance.sub(expectedReward).abs();

            expect(difference.lte(delta)).to.be.true;
        });

        it('Should reject claiming rewards with no staked tokens', async function () {
            await expect(staking.connect(user2).claimRewards()).to.be.rejectedWith('No tokens staked');
        });
    });

    describe('Add Reward Tokens', function () {
        it('Should allow owner to add reward tokens', async function () {
            const additionalReward = ethers.utils.parseEther('500');
            await odtToken.mint(owner.address, additionalReward);
            await odtToken.approve(staking.address, additionalReward);
            await staking.addRewardTokens(additionalReward);

            const contractBalance = await odtToken.balanceOf(staking.address);
            expect(contractBalance.toString()).to.equal(ethers.utils.parseEther('500500').toString());
        });

        it('Should reject non-owner adding reward tokens', async function () {
            const additionalReward = ethers.utils.parseEther('500');
            await odtToken.mint(user1.address, additionalReward);
            await odtToken.connect(user1).approve(staking.address, additionalReward);

            await expect(staking.connect(user1).addRewardTokens(additionalReward)).to.be.rejectedWith(
                'OwnableUnauthorizedAccount',
            );
        });
    });

    describe('Set Reward Per Second', function () {
        it('Should allow owner to set new reward rate', async function () {
            const newRewardRate = ethers.utils.parseEther('0.0001');
            await staking.setRewardPerSecond(newRewardRate);

            const currentRewardRate = await staking.rewardPerSecond();
            expect(currentRewardRate.toString()).to.equal(newRewardRate.toString());
        });

        it('Should reject non-owner setting new reward rate', async function () {
            const newRewardRate = ethers.utils.parseEther('0.0001');
            await expect(staking.connect(user1).setRewardPerSecond(newRewardRate)).to.be.rejectedWith(
                'OwnableUnauthorizedAccount',
            );
        });
    });
});
