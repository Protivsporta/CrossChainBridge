import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';

task("redeem", "Redeem tokens to current network")
  .addParam("from", "Address from which tokens were transfered")
  .addParam("to", "Address to transfer tokens")
  .addParam("amount", "Amount of tokens to transfer")
  .addParam("nonce", "Nonce of transaction")
  .addParam("sendersignature", "Sender signature")
  .addParam("backendsignature", "Signature of backend")
  .setAction(async (taskArgs, hre) => {
    const bscBridge = await hre.ethers.getContractAt("BridgeBSC", process.env.BSC_BRIDGE_CONTRACT_ADDR!);
    await bscBridge.redeem(taskArgs.from, taskArgs.to, taskArgs.amount, taskArgs.nonce, taskArgs.sendersignature, taskArgs.backendsignature);
    console.log(`Tokens was redeemed from ${taskArgs.from}!`);
  });