const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");


async function main() {

  const WhitelistContract = WHITELIST_CONTRACT_ADDRESS;
  
  const metadataURL = METADATA_URL;


  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL, 
    WhitelistContract
  );

  await deployedCryptoDevsContract.deployed();

  console.log("The CryptoDevs contract is deployed on %s", deployedCryptoDevsContract.address);

}

main()
  .then(() => process.exit(0)) 
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });

  //The whitelist contract is deployed on 0x18b7FA42Ff583bfBe9A463D48406af21372dE4ad