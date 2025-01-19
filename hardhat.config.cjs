require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const process = require('process');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: '0.8.0', // Pastikan ini sesuai dengan pragma Solidity
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        'tea-assam': {
            url: process.env.RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            chainId: Number(process.env.CHAIN_ID),
        },
    },
};
