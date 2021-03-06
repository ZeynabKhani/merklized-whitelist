const hre = require("hardhat");


async function main() {

  const { deployer } = await getNamedAccounts()

  console.log(deployer.address)

  const MerklizedWhitelist = await hre.ethers.getContractFactory("MerklizedWhitelist");

  // rootHash for the example whitelist in merklized-whitelist-test.js
  const rootHash = "0x191cae4c2df28425288375672299d5bcb1aa04220dd1761e9831431542e607db"

  const merklizedWhitelist = await MerklizedWhitelist.deploy("MerklizedWhitelist", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [
      rootHash
    ]
  });

  

  await merklizedWhitelist.deployed();

  console.log("MerklizedWhitelist deployed to:", merklizedWhitelist.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
