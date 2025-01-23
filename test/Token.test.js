import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Token Contract', function () {
    let token;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const Token = await ethers.getContractFactory('Token');
        token = await Token.deploy();
        await token.deployed();
    });

    describe('Initial Supply', function () {
        it('Should deploy with initial supply to owner', async function () {
            const totalSupply = await token.totalSupply();
            const ownerBalance = await token.balanceOf(owner.address);

            expect(ownerBalance.toString()).to.equal(totalSupply.toString());
        });
    });

    describe('Claim Faucet', function () {
        it('Should allow faucet claims up to the faucet limit', async function () {
            await token.connect(user).claimFaucet();
            const userBalanceAfterClaim = await token.balanceOf(user.address);

            expect(userBalanceAfterClaim.toString()).to.equal(ethers.utils.parseEther('100').toString());

            const totalDistributed = await token.totalFaucetDistributed();
            expect(totalDistributed.toString()).to.equal(ethers.utils.parseEther('100').toString());
        });

        it('Should prevent faucet claims exceeding the faucet limit', async function () {
            const faucetLimit = await token.faucetLimit();
            const faucetAmount = await token.faucetAmount();

            for (let i = 0; i < faucetLimit.div(faucetAmount).toNumber(); i++) {
                await token.connect(user).claimFaucet();
                await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);
                await ethers.provider.send('evm_mine', []);
            }

            await expect(token.connect(user).claimFaucet()).to.be.rejectedWith('Faucet limit reached');
        });

        it('Should allow faucet claims once every 24 hours', async function () {
            await token.connect(user).claimFaucet();
            await expect(token.connect(user).claimFaucet()).to.be.rejectedWith(
                'You can only claim once every 24 hours',
            );
        });
    });

    describe('Minted', function () {
        it('Should allow minting by owner', async function () {
            const mintAmount = ethers.utils.parseEther('500');
            const initialBalance = await token.balanceOf(owner.address);

            await token.mint(owner.address, mintAmount);
            const finalBalance = await token.balanceOf(owner.address);

            expect(finalBalance.sub(initialBalance).toString()).to.equal(mintAmount.toString());
        });
    });

    describe('Burned', function () {
        it('Should allow burning tokens by owner or holder', async function () {
            const burnAmount = ethers.utils.parseEther('50');
            const initialBalance = await token.balanceOf(owner.address);

            await token.burn(burnAmount);
            const finalBalance = await token.balanceOf(owner.address);

            expect(initialBalance.sub(finalBalance).toString()).to.equal(burnAmount.toString());
        });

        it('Should not allow burning more than balance', async function () {
            const initialBalance = await token.balanceOf(owner.address);
            const burnAmount = initialBalance.add(ethers.utils.parseEther('1'));

            await expect(token.burn(burnAmount)).to.be.rejectedWith('Insufficient balance to burn');
        });
    });
});
