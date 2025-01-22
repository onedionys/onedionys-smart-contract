import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';

use(solidity);
use(chaiAsPromised);

describe('Lottery System', function () {
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
    });

    describe('Add Reward Tokens', function () {
        it('Should allow user to join the lottery', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await expect(lottery.connect(user1).joinLottery())
                .to.emit(lottery, 'JoinedLottery')
                .withArgs(user1.address, ethers.utils.parseEther('10'));
        });

        it('Should allow user to spin the wheel and mint an NFT', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).joinLottery();

            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            const spinResult = await lottery.connect(user1).spinWheel();
            expect(spinResult).to.emit(lottery, 'SpinWheel');

            const balance = await nftCollection.balanceOf(user1.address);
            expect(balance).to.equal(1);

            const nftDetails = await nftCollection.getNFTDetails(0);
            expect(['Common', 'Rare', 'Epic', 'Legendary']).to.include(nftDetails[0]);
            expect(nftDetails[1].toNumber()).to.be.oneOf([10, 25, 50, 100]);
        });

        it('Should update user points after spinning the wheel', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).joinLottery();
            await lottery.connect(user1).spinWheel();

            const points = await lottery.userPoints(user1.address);
            expect(points.toNumber()).to.be.greaterThan(0);
        });
    });

    describe('Add Reward Tokenss', function () {
        it('Should update leaderboard correctly', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).joinLottery();
            await lottery.connect(user1).spinWheel();

            const leaderboard = await lottery.getLeaderboard();
            expect(leaderboard[0]).to.include(user1.address);
        });

        it('Should enforce cooldown on spinning the wheel', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('20'));
            await lottery.connect(user1).joinLottery();
            await lottery.connect(user1).spinWheel();

            await expect(lottery.connect(user1).spinWheel()).to.be.revertedWith('Spin cooldown active');
        });

        it('Owner can withdraw tokens from Lottery contract', async function () {
            await token.connect(user1).approve(lottery.address, ethers.utils.parseEther('10'));
            await lottery.connect(user1).joinLottery();

            const initialBalance = await token.balanceOf(owner.address);

            await lottery.connect(owner).withdrawTokens();
            const finalBalance = await token.balanceOf(owner.address);

            expect(BigNumber.from(finalBalance).gt(BigNumber.from(initialBalance))).to.be.true;
        });
    });
});
