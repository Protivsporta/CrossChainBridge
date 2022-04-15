import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("swap", "Swap tokens from one network to another")
  .addParam("to", "Address to transfer tokens")
  .addParam("amount", "Amount of tokens to transfer")
  .addParam("signature", "Signature of backend")
  .setAction(async (taskArgs, hre) => {
    const bscBridge = await hre.ethers.getContractAt("BridgeBSC", process.env.BSC_BRIDGE_CONTRACT_ADDR!);
    await bscBridge.swap(taskArgs.to, taskArgs.amount, taskArgs.signature);
    console.log(`Tokens was swapped to ${taskArgs.to}!`);
  });