// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Leaderboard {
    struct Activity {
        string activity;
        string description;
        uint256 amount;
        uint256 timestamp;
        string txhash;
    }

    address[] public users;

    mapping(address => Activity[]) public userActivities;
    mapping(address => bool) public isUserRegistered;
    mapping(string => string[]) public activityExtraData;

    event ActivityAdded(
        address indexed user,
        string activity,
        string description,
        uint256 amount,
        uint256 timestamp,
        string txhash,
        string[] extraData
    );

    function addActivity(
        address _user,
        string memory _activity,
        string memory _description,
        uint256 _amount,
        string memory _txhash,
        string[] memory _extraData
    ) public {
        if (!isUserRegistered[_user]) {
            isUserRegistered[_user] = true;
            users.push(_user);
        }

        Activity memory newActivity = Activity({
            activity: _activity,
            description: _description,
            amount: _amount,
            timestamp: block.timestamp,
            txhash: _txhash
        });

        userActivities[_user].push(newActivity);
        activityExtraData[_txhash] = _extraData;

        emit ActivityAdded(_user, _activity, _description, _amount, block.timestamp, _txhash, _extraData);
    }

    function getExtraData(string memory _txhash) public view returns (string[] memory) {
        return activityExtraData[_txhash];
    }

    function getActivities(address _user) public view returns (Activity[] memory) {
        return userActivities[_user];
    }

    function getAllUsers() public view returns (address[] memory) {
        return users;
    }
}
