require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();
//require("@nomiclabs/hardhat-waffle");

const GOERLI_URL = process.env.GOERLI_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const LOCAL_PRIVATE_KEY = process.env.LOCAL_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: GOERLI_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/",
      account: [LOCAL_PRIVATE_KEY],
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      goerli: process.env.ETHERSCAN_API_KEY,
    },
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};
