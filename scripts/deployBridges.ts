import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();

  const backendAddress = "0x7Ac51e9D2C3daC0f401dd546F27b36d49cE2FB7c";

  const BridgeBSC = await ethers.getContractFactory("BridgeBSC", signer);
  const bridgebsc = await BridgeBSC.deploy("0x0107A4034DC1fCE4Adaff24Cd57A97bB79B64991", backendAddress); 
  await bridgebsc.deployed();

  console.log("BSC bridge contract deployed to:", bridgebsc.address);

  const BridgeETH = await ethers.getContractFactory("BridgeETH", signer);
  const bridgeeth = await BridgeETH.deploy("0x08c7B2F49A359DD63D92E20177442779276f6DaF", backendAddress); 
  await bridgeeth.deployed();

  console.log("ETH bridge contract deployed to:", bridgeeth.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});