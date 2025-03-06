// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Referral {
    IERC20 public token;

    struct ReferralDetail {
        address referredWallet;
        uint256 registrationTime;
    }

    struct User {
        uint256 referralsCount;
        uint256 registrationTime;
        bool exists;
        ReferralDetail[] referralDetails;
    }

    uint256 public constant REWARD_AMOUNT = 10 * 10 ** 18;
    uint256 public totalRewardPool;
    address[] public allUsers;
    address public owner;

    mapping(address => User) public users;
    mapping(address => address) public referredBy;

    event UserRegistered(address indexed user, address indexed referrer, uint256 timestamp);
    event RewardIssued(address indexed referrer, uint256 reward);
    event RewardTokensAdded(uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not the owner');
        _;
    }

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        owner = msg.sender;
    }

    function register(address _referrer) external {
        require(!users[msg.sender].exists, 'User already registered');
        require(_referrer != msg.sender, 'Invalid referrer');
        require(_referrer == address(0) || users[_referrer].exists, 'Invalid referrer');
        require(totalRewardPool >= REWARD_AMOUNT, 'Not enough tokens in contract for rewards');

        users[msg.sender].exists = true;
        users[msg.sender].registrationTime = block.timestamp;
        allUsers.push(msg.sender);

        if (_referrer != address(0)) {
            referredBy[msg.sender] = _referrer;

            users[_referrer].referralsCount++;
            users[_referrer].referralDetails.push(ReferralDetail(msg.sender, block.timestamp));

            totalRewardPool -= REWARD_AMOUNT;

            require(token.transfer(_referrer, REWARD_AMOUNT), 'Reward transfer failed');
            emit RewardIssued(_referrer, REWARD_AMOUNT);
        }

        emit UserRegistered(msg.sender, _referrer, block.timestamp);
    }

    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 length = allUsers.length;
        address[] memory leaderboardAddresses = new address[](length);
        uint256[] memory leaderboardCounts = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            leaderboardAddresses[i] = allUsers[i];
            leaderboardCounts[i] = users[allUsers[i]].referralsCount;
        }

        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = 0; j < length - 1; j++) {
                if (leaderboardCounts[j] < leaderboardCounts[j + 1]) {
                    uint256 tempCount = leaderboardCounts[j];
                    leaderboardCounts[j] = leaderboardCounts[j + 1];
                    leaderboardCounts[j + 1] = tempCount;

                    address tempAddress = leaderboardAddresses[j];
                    leaderboardAddresses[j] = leaderboardAddresses[j + 1];
                    leaderboardAddresses[j + 1] = tempAddress;
                }
            }
        }

        return (leaderboardAddresses, leaderboardCounts);
    }

    function getReferralDetails(address _user) external view returns (ReferralDetail[] memory) {
        require(users[_user].exists, 'User not registered');
        return users[_user].referralDetails;
    }

    function getUserDetails(address _user) external view returns (uint256 referralsCount, uint256 registrationTime) {
        require(users[_user].exists, 'User not registered');
        return (users[_user].referralsCount, users[_user].registrationTime);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance), 'Withdraw failed');
    }

    function addRewardTokens(uint256 amount) external onlyOwner {
        require(amount > 0, 'Amount should be greater than 0');

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, 'Allowance not sufficient to add reward tokens');

        token.transferFrom(msg.sender, address(this), amount);
        totalRewardPool += amount;

        emit RewardTokensAdded(amount);
    }
}
