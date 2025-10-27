// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EVCharging {
    address public owner;
    mapping(address => uint256) public startTimes;

    constructor() {
        owner = msg.sender;
    }

    function startCharging() external {
        require(startTimes[msg.sender] == 0, "Already charging");
        startTimes[msg.sender] = block.timestamp;
    }

    function stopCharging() external payable {
        require(startTimes[msg.sender] != 0, "Charging not started");

        uint256 duration = block.timestamp - startTimes[msg.sender];
        uint256 cost = duration * 1e14; // Fixed rate: 0.0001 ETH/sec

        require(msg.value >= cost, "Insufficient payment");
        startTimes[msg.sender] = 0;

        payable(owner).transfer(cost);
    }

    function getChargingDuration(address user) external view returns (uint256) {
        if (startTimes[user] == 0) return 0;
        return block.timestamp - startTimes[user];
    }
}
