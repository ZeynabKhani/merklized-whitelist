require("@nomiclabs/hardhat-waffle");
require('dotenv').config
require('hardhat-deploy')

let privateKey = process.env.PRIVATE_KEY

module.exports = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/KCJUERkm12wgMiYsJod_I595NsBxMWdC",
      chainId: 3,
      account: privateKey
    }
  }
};
