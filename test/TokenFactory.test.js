import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('Token Creator Contract', function () {
    let tokenFactory;
    let owner, user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        const TokenFactory = await ethers.getContractFactory('TokenFactory');
        tokenFactory = await TokenFactory.deploy();
        await tokenFactory.deployed();
    });

    describe('Create Token', function () {
        it('Should create a new token with specified name, symbol, and supply', async function () {
            const name = 'Test Token';
            const symbol = 'TST';
            const totalSupply = ethers.utils.parseUnits('1000', 0);

            const tx = await tokenFactory.createToken(name, symbol, totalSupply);
            const receipt = await tx.wait();

            const event = receipt.events.find((e) => e.event === 'TokenCreated');
            const [tokenAddress, , , adjustedTotalSupply] = event.args;

            expect(ethers.utils.isAddress(tokenAddress)).to.be.true;

            const ERC20Token = await ethers.getContractFactory('ERC20Token');
            const newToken = ERC20Token.attach(tokenAddress);
            const actualSupply = await newToken.totalSupply();

            expect(actualSupply.toString()).to.equal(adjustedTotalSupply.toString());
        });

        it('Should reject if total supply is zero', async function () {
            const name = 'Invalid Token';
            const symbol = 'INV';
            const totalSupply = ethers.utils.parseUnits('0', 0);

            await expect(tokenFactory.createToken(name, symbol, totalSupply)).to.be.rejectedWith(
                'Total supply must be greater than zero',
            );
        });
    });

    describe('Token Interactions', function () {
        let tokenAddress, newToken;

        beforeEach(async function () {
            const name = 'Interactive Token';
            const symbol = 'ITK';
            const totalSupply = ethers.utils.parseUnits('1000', 0);

            const tx = await tokenFactory.createToken(name, symbol, totalSupply);
            const receipt = await tx.wait();

            tokenAddress = receipt.events.find((e) => e.event === 'TokenCreated').args[0];

            const ERC20Token = await ethers.getContractFactory('ERC20Token');
            newToken = ERC20Token.attach(tokenAddress);
        });

        it('Should allow token transfers between accounts', async function () {
            const transferAmount = ethers.utils.parseUnits('100', 18);

            await newToken.transfer(user.address, transferAmount);

            const userBalance = await newToken.balanceOf(user.address);
            const ownerBalance = await newToken.balanceOf(owner.address);

            expect(userBalance.toString()).to.equal(transferAmount.toString());
            expect(ownerBalance.toString()).to.equal(ethers.utils.parseUnits('900', 18).toString());
        });

        it('Should not allow transfers exceeding balance', async function () {
            const transferAmount = ethers.utils.parseUnits('1100', 18);

            await expect(newToken.transfer(user.address, transferAmount)).to.be.rejectedWith(
                'ERC20InsufficientBalance',
            );
        });
    });
});
