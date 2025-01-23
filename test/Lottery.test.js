import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';

use(solidity);
use(chaiAsPromised);

describe('Lottery Contract', function () {
    let Token, token, NFTCollection, nftCollection, Lottery, lottery;
    let owner, user1, user2;

    beforeEach(async function () {
        Token = await ethers.getContractFactory('Token');
        [owner, user1, user2] = await ethers.getSigners();
        token = await Token.deploy();
        await token.deployed();

        NFTCollection = await ethers.getContractFactory('NFTCollection');
        nftCollection = await NFTCollection.deploy();
        await nftCollection.deployed();

        Lottery = await ethers.getContractFactory('Lottery');
        lottery = await Lottery.deploy(token.address, nftCollection.address);
        await lottery.deployed();

        await nftCollection.connect(owner).setLotteryContract(lottery.address);

        await token.connect(owner).mint(user1.address, ethers.utils.parseEther('100'));
        await token.connect(owner).mint(user2.address, ethers.utils.parseEther('100'));

        const rewardAmount = ethers.utils.parseEther('500');
        await token.mint(owner.address, rewardAmount);
        await token.approve(lottery.address, rewardAmount);
        await lottery.addRewardTokens(rewardAmount);
    });

    describe('Spin Wheel', function () {
        it('Should allow user to spin the wheel and mint an NFT', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            const spinResult = await lottery.connect(user1).spinWheel();
            expect(spinResult).to.emit(lottery, 'SpinWheel');

            const balance = await nftCollection.balanceOf(user1.address);
            expect(balance).to.equal(1);

            const nftDetails = await nftCollection.getNFTDetails(0);
            expect(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Godlike', 'Unique']).to.include(
                nftDetails[0],
            );
            expect(nftDetails[1].toNumber()).to.be.oneOf([10, 25, 50, 75, 100, 200, 300, 500]);
        });

        it('Should update user points after spinning the wheel', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).spinWheel();

            const points = await lottery.userPoints(user1.address);
            expect(points.toNumber()).to.be.greaterThan(0);
        });

        it('Should enforce cooldown on spinning the wheel', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).spinWheel();

            await expect(lottery.connect(user1).spinWheel()).to.be.revertedWith('Spin cooldown active');
        });

        it('Should not allow spinning the wheel before cooldown', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).spinWheel();

            await expect(lottery.connect(user1).spinWheel()).to.be.revertedWith('Spin cooldown active');
        });
    });

    describe('Show Leaderboard', function () {
        it('Should add user to leaderboard after spinning', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).spinWheel();

            const leaderboard = await lottery.getLeaderboard();
            const firstEntry = leaderboard;
            expect(firstEntry[0][0]).to.equal(user1.address);
            expect(Number(firstEntry[1][0])).to.be.greaterThan(0);
        });

        it('Should update leaderboard correctly', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).spinWheel();

            const leaderboard = await lottery.getLeaderboard();
            expect(leaderboard[0]).to.include(user1.address);
        });

        it('Should update leaderboard when withdrawing points', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).spinWheel();

            await token.connect(user2).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user2).spinWheel();

            const leaderboardBefore = await lottery.getLeaderboard();
            await lottery.connect(user1).withdrawTokens();

            const leaderboardAfter = await lottery.getLeaderboard();
            expect(leaderboardBefore[0].length).to.be.greaterThan(leaderboardAfter[0].length);
        });
    });

    describe('Withdraw Token', function () {
        it('Owner can withdraw tokens from Lottery contract', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).spinWheel();

            const initialBalance = await token.balanceOf(user1.address);

            await lottery.connect(user1).withdrawTokens();
            const finalBalance = await token.balanceOf(user1.address);

            expect(BigNumber.from(finalBalance).gt(BigNumber.from(initialBalance))).to.be.true;
        });

        it('Should allow withdrawal of points and burn NFTs', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).spinWheel();

            const initialBalance = await token.balanceOf(user1.address);
            const points = await lottery.userPoints(user1.address);

            const pointsInWei = ethers.utils.parseEther(points.toString());

            await lottery.connect(user1).withdrawTokens();

            const finalBalance = await token.balanceOf(user1.address);

            expect(finalBalance.sub(initialBalance)).to.equal(pointsInWei);
        });

        it('Should allow burning NFTs for points', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).spinWheel();

            const userTokens = await nftCollection.getUserTokens(user1.address);
            const tokenId = userTokens[0];

            const nftDetails = await nftCollection.getNFTDetails(tokenId);
            const points = nftDetails[1];

            const pointsInWei = ethers.utils.parseEther(points.toString());

            const initialBalance = await token.balanceOf(user1.address);

            await lottery.connect(user1).burnNft(tokenId);

            const finalBalance = await token.balanceOf(user1.address);

            expect(finalBalance.sub(initialBalance)).to.equal(pointsInWei);
        });

        it('Should allow user to withdraw tokens after spinning the wheel', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).spinWheel();

            const pointsBefore = await lottery.userPoints(user1.address);

            await lottery.connect(user1).withdrawTokens();

            const pointsAfter = await lottery.userPoints(user1.address);
            expect(pointsBefore.toNumber()).to.be.greaterThan(0);
            expect(pointsAfter.toNumber()).to.equal(0);
        });
    });
});
