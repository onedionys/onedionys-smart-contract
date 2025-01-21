import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Quiz Contract', function () {
    let owner, user1, user2;
    let quiz, odtToken;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const ODTToken = await ethers.getContractFactory('OneDionysToken');
        odtToken = await ODTToken.deploy();
        await odtToken.deployed();

        await odtToken.mint(user1.address, ethers.utils.parseEther('100'));
        await odtToken.mint(user2.address, ethers.utils.parseEther('100'));

        const Quiz = await ethers.getContractFactory('Quiz');
        quiz = await Quiz.deploy(odtToken.address);
        await quiz.deployed();

        const rewardAmount = ethers.utils.parseEther('500');
        await odtToken.mint(owner.address, rewardAmount);
        await odtToken.approve(quiz.address, rewardAmount);
        await quiz.addRewardTokens(rewardAmount);
    });

    describe('Join Quiz', function () {
        it('Should allow users to join the quiz with sufficient tokens', async function () {
            const joinAmount = ethers.utils.parseEther('15');
            const ownerShare = ethers.utils.parseEther('5');
            const contractShare = ethers.utils.parseEther('10');

            const userInitialBalance = await odtToken.balanceOf(user1.address);
            const ownerInitialBalance = await odtToken.balanceOf(owner.address);
            const contractInitialBalance = await odtToken.balanceOf(quiz.address);

            await odtToken.connect(user1).approve(quiz.address, joinAmount);
            await quiz.connect(user1).joinQuiz();

            const userFinalBalance = await odtToken.balanceOf(user1.address);
            const ownerFinalBalance = await odtToken.balanceOf(owner.address);
            const contractFinalBalance = await odtToken.balanceOf(quiz.address);

            expect(userFinalBalance.toString()).to.equal(userInitialBalance.sub(joinAmount).toString());
            expect(contractFinalBalance.toString()).to.equal(contractInitialBalance.add(contractShare).toString());
            expect(ownerFinalBalance.toString()).to.equal(ownerInitialBalance.add(ownerShare).toString());
        });
    });

    describe('Submit Answer', function () {
        it('Should increase user points if the answer is correct', async function () {
            await quiz.connect(user1).submitAnswer(true);

            const points = await quiz.userPoints(user1.address);
            expect(points.toString()).to.equal('1');
        });

        it('Should not increase points if the answer is incorrect', async function () {
            await quiz.connect(user1).submitAnswer(false);

            const points = await quiz.userPoints(user1.address);
            expect(points.toString()).to.equal('0');
        });
    });

    describe('Claim Rewards', function () {
        it('Should allow users to claim rewards for their points', async function () {
            const joinAmount = ethers.utils.parseEther('15');

            await odtToken.connect(user1).approve(quiz.address, joinAmount);
            await quiz.connect(user1).joinQuiz();

            await quiz.connect(user1).submitAnswer(true);
            await quiz.connect(user1).submitAnswer(true);

            const expectedReward = await quiz.calculateReward(user1.address);
            expect(expectedReward.toString()).to.equal(ethers.utils.parseEther('6').toString()); // 2 points * 3 * 10^18

            await quiz.connect(user1).claimRewards();

            const userBalance = await odtToken.balanceOf(user1.address);
            expect(userBalance.toString()).to.equal(ethers.utils.parseEther('91').toString());

            const contractRewardPool = await quiz.totalRewardPool();
            expect(contractRewardPool.toString()).to.equal(ethers.utils.parseEther('494').toString());
        });

        it('Should reject reward claims with zero points', async function () {
            await expect(quiz.connect(user2).claimRewards()).to.be.rejectedWith('No points to claim');
        });
    });

    describe('Add Reward Tokens', function () {
        it('Should allow owner to add reward tokens', async function () {
            const additionalReward = ethers.utils.parseEther('500');
            await odtToken.mint(owner.address, additionalReward);
            await odtToken.approve(quiz.address, additionalReward);

            await quiz.addRewardTokens(additionalReward);

            const newRewardPool = await quiz.totalRewardPool();
            expect(newRewardPool.toString()).to.equal(ethers.utils.parseEther('1000').toString());
        });

        it('Should reject non-owner trying to add reward tokens', async function () {
            const additionalReward = ethers.utils.parseEther('500');
            await odtToken.mint(user1.address, additionalReward);
            await odtToken.connect(user1).approve(quiz.address, additionalReward);

            await expect(quiz.connect(user1).addRewardTokens(additionalReward)).to.be.rejectedWith(
                'OwnableUnauthorizedAccount',
            );
        });
    });
});
