import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';

use(solidity);
use(chaiAsPromised);

describe('Native Contract', function () {
    let native;
    let owner;
    let user;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        const Native = await ethers.getContractFactory('Native');
        native = await Native.deploy();
        await native.deployed();
    });

    describe('Deployment', function () {
        it('Should set the correct owner', async function () {
            const contractOwner = await native.owner();
            expect(contractOwner).to.equal(owner.address);
        });
    });

    describe('Faucet Functionality', function () {
        it('Should allow users to claim faucet if conditions are met', async function () {
            await native.connect(owner).depositNative({ value: ethers.utils.parseEther('10') });
            await native.connect(user).claimFaucet();

            const totalDistributed = await native.totalFaucetDistributed();
            expect(totalDistributed.toString()).to.equal(ethers.utils.parseEther('1').toString());

            const lastClaimTime = await native.lastClaimTime(user.address);
            expect(lastClaimTime.toNumber()).to.be.greaterThan(0);
        });

        it('Should prevent claims if faucet limit is reached', async function () {
            await native.connect(owner).depositNative({ value: ethers.utils.parseEther('500') });

            for (let i = 0; i < 10; i++) {
                await native.connect(user).claimFaucet();
                await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);
                await ethers.provider.send('evm_mine', []);
            }

            await expect(native.connect(user).claimFaucet()).to.be.rejectedWith('Faucet limit reached');
        });

        it('Should prevent multiple claims within 24 hours', async function () {
            await native.connect(owner).depositNative({ value: ethers.utils.parseEther('10') });

            await native.connect(user).claimFaucet();
            await expect(native.connect(user).claimFaucet()).to.be.rejectedWith('Claim only once every 24 hours');
        });

        it('Should fail if the faucet has insufficient balance', async function () {
            await expect(native.connect(user).claimFaucet()).to.be.rejectedWith('Insufficient balance in faucet');
        });
    });

    describe('Donations', function () {
        it('Should accept donations and emit DonationReceived event', async function () {
            const donationAmount = ethers.utils.parseEther('2');
            await expect(() =>
                user.sendTransaction({
                    to: native.address,
                    value: donationAmount,
                }),
            ).to.changeEtherBalances([user, native], [donationAmount.mul(-1), donationAmount]);

            await expect(
                user.sendTransaction({
                    to: native.address,
                    value: donationAmount,
                }),
            )
                .to.emit(native, 'DonationReceived')
                .withArgs(user.address, donationAmount);
        });

        it('Should fail if donation amount is zero', async function () {
            await expect(native.connect(user).donate({ value: 0 })).to.be.rejectedWith(
                'Donation amount must be greater than 0',
            );
        });
    });

    describe('Withdrawals', function () {
        it('Should allow the owner to withdraw funds', async function () {
            const depositAmount = ethers.utils.parseEther('5');
            await owner.sendTransaction({ to: native.address, value: depositAmount });

            const withdrawAmount = ethers.utils.parseEther('5');
            await expect(() => native.connect(owner).withdrawNative(withdrawAmount)).to.changeEtherBalances(
                [native, owner],
                [withdrawAmount.mul(-1), withdrawAmount],
            );
        });

        it('Should fail if non-owner tries to withdraw funds', async function () {
            await expect(native.connect(user).withdrawNative(ethers.utils.parseEther('1'))).to.be.rejectedWith(
                'OwnableUnauthorizedAccount',
            );
        });

        it('Should fail if withdrawal amount exceeds balance', async function () {
            await expect(native.connect(owner).withdrawNative(ethers.utils.parseEther('1'))).to.be.rejectedWith(
                'Insufficient balance in contract',
            );
        });
    });

    describe('Deposit Native', function () {
        it('Should allow owner to deposit native tokens', async function () {
            const depositAmount = ethers.utils.parseEther('5');
            await native.connect(owner).depositNative({ value: depositAmount });

            const contractBalance = await ethers.provider.getBalance(native.address);
            expect(contractBalance.toString()).to.equal(depositAmount.toString());
        });

        it('Should fail if deposit amount is zero', async function () {
            await expect(native.connect(owner).depositNative({ value: 0 })).to.be.rejectedWith(
                'Deposit amount must be greater than 0',
            );
        });
    });

    describe('Get Contract Balance', function () {
        it('Should return the correct contract balance', async function () {
            const depositAmount = ethers.utils.parseEther('5');
            await native.connect(owner).depositNative({ value: depositAmount });

            const balance = await native.getContractBalance();
            expect(balance.toString()).to.equal(depositAmount.toString());
        });
    });
});
