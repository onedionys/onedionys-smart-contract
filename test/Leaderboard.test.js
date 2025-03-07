import { expect, use } from 'chai';
import pkg from 'hardhat';
const { ethers } = pkg;
import chaiAsPromised from 'chai-as-promised';
import { solidity } from 'ethereum-waffle';

use(solidity);
use(chaiAsPromised);

describe('Leaderboard Contract', function () {
    let leaderboard;
    let user1;
    let user2;

    beforeEach(async function () {
        [, user1, user2] = await ethers.getSigners();
        const Leaderboard = await ethers.getContractFactory('Leaderboard');
        leaderboard = await Leaderboard.deploy();
        await leaderboard.deployed();
    });

    describe('Add Activity', function () {
        it('Should add activity for a new user and register them', async function () {
            const activity = {
                activity: 'stake',
                description: 'Staking 100 tokens',
                amount: 100,
                txhash: '0x123',
            };

            await leaderboard.addActivity(
                user1.address,
                activity.activity,
                activity.description,
                activity.amount,
                activity.txhash,
                [],
            );

            const userActivities = await leaderboard.getActivities(user1.address);
            expect(userActivities.length).to.equal(1);
            expect(userActivities[0].activity).to.equal(activity.activity);
            expect(userActivities[0].description).to.equal(activity.description);
            expect(userActivities[0].amount.toString()).to.equal(activity.amount.toString());
            expect(userActivities[0].txhash).to.equal(activity.txhash);
        });

        it('Should add multiple activities for a user', async function () {
            const activities = [
                { activity: 'stake', description: 'Stake 100 tokens', amount: 100, txhash: '0x123' },
                { activity: 'unstake', description: 'Unstake 50 tokens', amount: 50, txhash: '0x456' },
            ];

            for (const act of activities) {
                await leaderboard.addActivity(user1.address, act.activity, act.description, act.amount, act.txhash, []);
            }

            const userActivities = await leaderboard.getActivities(user1.address);
            expect(userActivities.length).to.equal(2);
            expect(userActivities[0].activity).to.equal(activities[0].activity);
            expect(userActivities[1].activity).to.equal(activities[1].activity);
        });

        it('Should register user only once', async function () {
            await leaderboard.addActivity(user1.address, 'stake', 'Stake 100 tokens', 100, '0x123', []);

            const users = await leaderboard.getAllUsers();
            expect(users.length).to.equal(1);
            expect(users[0]).to.equal(user1.address);

            await leaderboard.addActivity(user1.address, 'unstake', 'Unstake 50 tokens', 50, '0x456', []);

            const updatedUsers = await leaderboard.getAllUsers();
            expect(updatedUsers.length).to.equal(1);
        });

        it('Should handle activities from multiple users', async function () {
            await leaderboard.addActivity(user1.address, 'stake', 'Stake 100 tokens', 100, '0x123', []);
            await leaderboard.addActivity(user2.address, 'stake', 'Stake 200 tokens', 200, '0x456', []);

            const users = await leaderboard.getAllUsers();
            expect(users.length).to.equal(2);
            expect(users).to.include(user1.address);
            expect(users).to.include(user2.address);

            const user1Activities = await leaderboard.getActivities(user1.address);
            const user2Activities = await leaderboard.getActivities(user2.address);

            expect(user1Activities.length).to.equal(1);
            expect(user1Activities[0].amount.toString()).to.equal('100');
            expect(user2Activities.length).to.equal(1);
            expect(user2Activities[0].amount.toString()).to.equal('200');
        });
    });

    describe('Get All Users', function () {
        it('Should return an empty list if no users are registered', async function () {
            const users = await leaderboard.getAllUsers();
            expect(users.length).to.equal(0);
        });

        it('Should return all registered users', async function () {
            await leaderboard.addActivity(user1.address, 'stake', 'Stake 100 tokens', 100, '0x123', []);
            await leaderboard.addActivity(user2.address, 'stake', 'Stake 200 tokens', 200, '0x456', []);

            const users = await leaderboard.getAllUsers();
            expect(users.length).to.equal(2);
            expect(users).to.include(user1.address);
            expect(users).to.include(user2.address);
        });
    });

    describe('Get Activities', function () {
        it('Should return an empty list for a user with no activities', async function () {
            const activities = await leaderboard.getActivities(user1.address);
            expect(activities.length).to.equal(0);
        });

        it('Should return all activities for a specific user', async function () {
            await leaderboard.addActivity(user1.address, 'stake', 'Stake 100 tokens', 100, '0x123', []);
            await leaderboard.addActivity(user1.address, 'unstake', 'Unstake 50 tokens', 50, '0x456', []);

            const activities = await leaderboard.getActivities(user1.address);
            expect(activities.length).to.equal(2);
            expect(activities[0].activity).to.equal('stake');
            expect(activities[1].activity).to.equal('unstake');
        });
    });
});
