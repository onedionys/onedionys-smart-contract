import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Referral System Contract', function () {
    let token, owner, referral, user1, user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy();
        await token.deployed();

        const Referral = await ethers.getContractFactory('Referral');
        referral = await Referral.deploy(token.address);
        await referral.deployed();

        await token.mint(referral.address, ethers.utils.parseEther('10000'));
        const rewardAmount = ethers.utils.parseEther('10000');
        await token.mint(owner.address, rewardAmount);
        await token.approve(referral.address, rewardAmount);
        await referral.addRewardTokens(rewardAmount);
    });

    describe('Registration and Referral', function () {
        it('Should allow a user to register without a referrer', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            const userDetails = await referral.users(user1.address);
            expect(userDetails.exists).to.be.true;
        });

        it('Should allow a user to register with a valid referrer and reward them', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            await referral.connect(user2).register(user1.address);

            const user1Details = await referral.users(user1.address);
            expect(user1Details.referralsCount.toNumber()).to.equal(1);

            const user1Balance = await token.balanceOf(user1.address);
            expect(user1Balance.toString()).to.equal(ethers.utils.parseEther('10').toString());
        });

        it('Should not allow registration with an invalid referrer', async function () {
            await expect(referral.connect(user2).register(user1.address)).to.be.rejectedWith('Invalid referrer');
        });

        it('Should prevent a user from registering twice', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            await expect(referral.connect(user1).register(ethers.constants.AddressZero)).to.be.rejectedWith(
                'User already registered',
            );
        });
    });

    describe('Leaderboard and Details', function () {
        it('Should correctly record referral details', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            await referral.connect(user2).register(user1.address);

            const details = await referral.getReferralDetails(user1.address);
            expect(details.length).to.equal(1);
            expect(details[0].referredWallet).to.equal(user2.address);
        });

        it('Should return the correct leaderboard', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            await referral.connect(user2).register(user1.address);

            const [addresses, counts] = await referral.getLeaderboard();
            expect(addresses[0]).to.equal(user1.address);
            expect(counts[0].toNumber()).to.equal(1);
        });
    });

    describe('Edge Cases', function () {
        it('Should not allow self-referrals', async function () {
            await expect(referral.connect(user1).register(user1.address)).to.be.rejectedWith('Invalid referrer');
        });

        it('Should not allow circular referrals', async function () {
            await referral.connect(user1).register(ethers.constants.AddressZero);
            await referral.connect(user2).register(user1.address);

            await expect(referral.connect(user1).register(user2.address)).to.be.rejectedWith('User already registered');
        });
    });
});
