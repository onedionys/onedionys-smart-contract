import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

describe('OneDionysToken', function () {
    let token;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const Token = await ethers.getContractFactory('OneDionysToken');
        token = await Token.deploy();
        await token.deployed();
    });

    it('Should deploy with initial supply to owner', async function () {
        const totalSupply = await token.totalSupply();
        const ownerBalance = await token.balanceOf(owner.address);

        console.log('totalSupply:', totalSupply.toString());
        console.log('ownerBalance:', ownerBalance.toString());

        expect(ownerBalance.toString()).to.equal(totalSupply.toString());
    });

    it('Should allow faucet claims once every 24 hours', async function () {
        const initialBalance = await token.balanceOf(user.address);
        console.log('Initial balance of user:', initialBalance.toString());

        // First time faucet claim
        await token.connect(user).claimFaucet();
        const userBalanceAfterClaim = await token.balanceOf(user.address);
        console.log('User balance after claiming faucet:', userBalanceAfterClaim.toString());

        expect(userBalanceAfterClaim.toString()).to.equal(ethers.utils.parseEther('100').toString());

        // Try claiming again before 24 hours, which should fail
        await expect(token.connect(user).claimFaucet()).to.be.rejectedWith('You can only claim once every 24 hours');
    });

    it('Should allow minting by owner', async function () {
        const mintAmount = ethers.utils.parseEther('500'); // Mint 500 tokens
        const initialBalance = await token.balanceOf(owner.address);
        console.log('Initial balance of owner before mint:', initialBalance.toString());

        // Mint token to owner
        await token.mint(owner.address, mintAmount);
        const finalBalance = await token.balanceOf(owner.address);
        console.log('Owner balance after mint:', finalBalance.toString());

        expect(finalBalance.sub(initialBalance).toString()).to.equal(mintAmount.toString());
    });

    it('Should allow burning tokens by owner or holder', async function () {
        const burnAmount = ethers.utils.parseEther('50');
        const initialBalance = await token.balanceOf(owner.address);
        console.log('Initial balance of owner before burn:', initialBalance.toString());

        // Owner burn token
        await token.burn(burnAmount);
        const finalBalance = await token.balanceOf(owner.address);
        console.log('Owner balance after burn:', finalBalance.toString());

        expect(initialBalance.sub(finalBalance).toString()).to.equal(burnAmount.toString());
    });

    it('Should not allow burning more than balance', async function () {
        const initialBalance = await token.balanceOf(owner.address);
        const burnAmount = initialBalance.add(ethers.utils.parseEther('1'));

        // Try to burn more than balance
        await expect(token.burn(burnAmount)).to.be.rejectedWith('Insufficient balance to burn');
    });
});
