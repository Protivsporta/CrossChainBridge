import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const BSCToken = await ethers.getContractFactory("BSCToken", signer);
  const bsctoken = await BSCToken.deploy("BSCToken", "BSCT", 1000000000);
  await bsctoken.deployed();

  console.log("BSC token contract deployed to:", bsctoken.address);

  const ETHToken = await ethers.getContractFactory("ETHToken", signer);
  const ethtoken = await ETHToken.deploy("ETHToken", "ETHT", 1000000000);
  await ethtoken.deployed();

  console.log("ETH token contract deployed to:", ethtoken.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});