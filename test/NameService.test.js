import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';

use(solidity);
use(chaiAsPromised);

describe('NameService', function () {
    let NameService, nameService, owner, addr1, addr2;

    beforeEach(async function () {
        NameService = await ethers.getContractFactory('NameService');
        [owner, addr1, addr2] = await ethers.getSigners();
        nameService = await NameService.deploy();
        await nameService.deployed();
    });

    it('should register a name with correct fee', async function () {
        const registrationFee = ethers.utils.parseEther('20');
        const name = 'myname';
        await nameService.connect(addr1).registerName(name, { value: registrationFee });

        const fullName = `${name}.chai`;
        expect(await nameService.getNamesByOwner(addr1.address)).to.include(fullName);
        expect(await nameService.getOwner(name)).to.equal(addr1.address);
    });

    it('should fail to register without sufficient fee', async function () {
        const name = 'myname';
        await expect(
            nameService.connect(addr2).registerName(name, { value: ethers.utils.parseEther('10') }),
        ).to.be.revertedWith('Insufficient registration fee');
    });

    it('should prevent duplicate name registration', async function () {
        const registrationFee = ethers.utils.parseEther('20');
        const name = 'myname';
        await nameService.connect(addr1).registerName(name, { value: registrationFee });

        await expect(nameService.connect(addr2).registerName(name, { value: registrationFee })).to.be.revertedWith(
            'Name already registered',
        );
    });

    it('should allow updating name by same wallet', async function () {
        const registrationFee = ethers.utils.parseEther('20');
        const name1 = 'myname1';
        const name2 = 'myname2';

        await nameService.connect(addr1).registerName(name1, { value: registrationFee });
        expect(await nameService.getNamesByOwner(addr1.address)).to.include(`${name1}.chai`);

        await nameService.connect(addr1).registerName(name2, { value: registrationFee });
        expect(await nameService.getNamesByOwner(addr1.address)).to.include(`${name2}.chai`);
        expect(await nameService.getOwner(name1)).to.equal(addr1.address);
        expect(await nameService.getOwner(name2)).to.equal(addr1.address);
    });

    it('should allow owner to withdraw funds', async function () {
        const registrationFee = ethers.utils.parseEther('20');
        const name = 'myname';

        await nameService.connect(addr1).registerName(name, { value: registrationFee });

        const contractBalance = await ethers.provider.getBalance(nameService.address);
        expect(contractBalance).to.equal(registrationFee);

        const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
        const tx = await nameService.withdrawFunds();
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

        const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
        expect(ownerFinalBalance).to.equal(ownerInitialBalance.add(contractBalance).sub(gasUsed));
    });

    it('should restrict withdrawFunds to owner only', async function () {
        await expect(nameService.connect(addr1).withdrawFunds()).to.be.revertedWith(
            'Only contract owner can perform this action',
        );
    });
});
