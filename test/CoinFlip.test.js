import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('CoinFlip Contract', function () {
    let CoinFlip, coinFlip;
    let Native, native;
    let player;

    beforeEach(async function () {
        [, player] = await ethers.getSigners();

        Native = await ethers.getContractFactory('Native');
        native = await Native.deploy();
        await native.deployed();

        CoinFlip = await ethers.getContractFactory('CoinFlip');
        coinFlip = await CoinFlip.deploy(native.address);
        await coinFlip.deployed();
    });

    it('Should initialize correctly', async function () {
        expect(await coinFlip.nativeContract()).to.equal(native.address);
    });

    describe('Coin Flip Game', function () {
        it('Should handle losses correctly (no winnings)', async function () {
            const INITIAL_BET = ethers.utils.parseEther('5');

            await coinFlip.connect(player).flip(false, { value: INITIAL_BET });

            const winnings = await coinFlip.winnings(player.address);
            expect(winnings.toNumber()).to.equal(0);
        });

        it('Should not allow users to bet more than the required amount', async function () {
            const incorrectBet = ethers.utils.parseEther('10');
            await expect(coinFlip.connect(player).flip(true, { value: incorrectBet })).to.be.rejectedWith(
                'Bet amount must be exactly 5 TEA',
            );
        });
    });

    describe('Claim Winnings', function () {
        it('Should revert if no winnings to claim', async function () {
            await expect(coinFlip.connect(player).claimWinnings()).to.be.rejectedWith('No winnings to claim');
        });
    });
});
