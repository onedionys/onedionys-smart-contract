import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('CoinFlip Contract', function () {
    let coinFlip;
    let native;
    let owner;
    let user;
    let user2;

    beforeEach(async function () {
        [owner, user, user2] = await ethers.getSigners();

        const Native = await ethers.getContractFactory('Native');
        native = await Native.deploy();
        await native.deployed();

        const CoinFlip = await ethers.getContractFactory('CoinFlip');
        coinFlip = await CoinFlip.deploy(native.address);
        await coinFlip.deployed();

        const teaAmount = ethers.utils.parseEther('5');
        await native.connect(owner).depositNative({ value: teaAmount });
    });

    describe('Coin Flip Game', function () {
        it('Should allow users to flip coin and bet 5 tea', async function () {
            await native.connect(user).approve(coinFlip.address, ethers.utils.parseEther('5'));
            const userBalanceBefore = await native.balanceOf(user.address);

            await coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5'));

            const userBalanceAfter = await native.balanceOf(user.address);

            expect(userBalanceAfter).to.be.greaterThan(userBalanceBefore);
        });

        it('Should not allow users to bet less than 5 tea', async function () {
            await expect(coinFlip.connect(user).flipCoin(ethers.utils.parseEther('4'))).to.be.rejectedWith(
                'Insufficient bet amount',
            );
        });

        it('Should allow users to win and double the bet amount', async function () {
            await native.connect(user).approve(coinFlip.address, ethers.utils.parseEther('5'));
            const userBalanceBefore = await native.balanceOf(user.address);

            await coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5'));

            const userBalanceAfter = await native.balanceOf(user.address);

            expect(userBalanceAfter.sub(userBalanceBefore)).to.equal(ethers.utils.parseEther('10'));
        });

        it('Should allow "double or nothing" functionality', async function () {
            await native.connect(user).approve(coinFlip.address, ethers.utils.parseEther('5'));
            await coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5'));

            const userBalanceAfterFirstWin = await native.balanceOf(user.address);

            await native.connect(user).approve(coinFlip.address, userBalanceAfterFirstWin);
            await coinFlip.connect(user).flipCoin(userBalanceAfterFirstWin);

            const userBalanceAfterSecondWin = await native.balanceOf(user.address);

            expect(userBalanceAfterSecondWin).to.equal(userBalanceAfterFirstWin.mul(2));
        });

        it('Should handle loss and no payout', async function () {
            await native.connect(user).approve(coinFlip.address, ethers.utils.parseEther('5'));
            const userBalanceBefore = await native.balanceOf(user.address);

            await coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5'));

            const userBalanceAfter = await native.balanceOf(user.address);

            expect(userBalanceAfter).to.be.lessThan(userBalanceBefore);
        });

        it('Should emit correct events on game outcome', async function () {
            await native.connect(user).approve(coinFlip.address, ethers.utils.parseEther('5'));

            await expect(coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5')))
                .to.emit(coinFlip, 'GameResult')
                .withArgs(user.address, ethers.utils.parseEther('5'), true);
        });
    });

    describe('Edge Case Scenarios', function () {
        it('Should prevent non-players from calling flipCoin', async function () {
            await expect(coinFlip.connect(user2).flipCoin(ethers.utils.parseEther('5'))).to.be.rejectedWith(
                'Insufficient balance in contract',
            );
        });

        it('Should not allow users to bet more than available balance', async function () {
            const userBalance = await native.balanceOf(user.address);

            if (userBalance.lt(ethers.utils.parseEther('5'))) {
                await expect(coinFlip.connect(user).flipCoin(ethers.utils.parseEther('5'))).to.be.rejectedWith(
                    'Insufficient balance',
                );
            }
        });
    });
});
