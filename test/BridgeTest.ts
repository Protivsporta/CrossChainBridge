import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, utils, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BridgeBSC", function () {

  let bscToken: Contract;
  let bridgeContract: Contract;

  let owner: SignerWithAddress;
  let backendSigner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let clean: any;

  const initialTokenBalance: BigNumber = utils.parseUnits("100000000", 18);

  before(async () => {
    [owner, backendSigner, addr1, addr2, addr3] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("BSCToken", owner);
    bscToken = await Token.deploy(
      "BSCToken",
      "BSCT",
      initialTokenBalance
    );
    const BridgeContract = await ethers.getContractFactory("BridgeBSC", owner);
    bridgeContract = await BridgeContract.deploy(
      bscToken.address,
      backendSigner.address
    );

    clean = await network.provider.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  afterEach(async () => {
    await network.provider.request({
      method: "evm_revert",
      params: [clean],
    });
    clean = await network.provider.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  function genMessage(addr: string, amount: BigNumber): string {
    return ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [addr, amount],
    )
  }

  function genBackendMessage(
    fromAddr: string, 
    toAddr: string, 
    amount: BigNumber,
    nonce: BigNumber,
    senderSignature: string,
    ): string {
    return ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "bytes"],
      [fromAddr, toAddr, amount, nonce, senderSignature],
    )
  }

  async function signMessage(account: SignerWithAddress, message: string): Promise<string> {
    return await account.signMessage(ethers.utils.arrayify(message)) 
  }

  function bigInt(value: string): BigNumber {
    return utils.parseUnits(value, 0);
  }

  it("Check swap emiting event", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(owner.address, amount);
    const signature = await signMessage(owner, msg);
    const balanceOfSender = await bscToken.balanceOf(owner.address);
    const totalSupply = await bscToken.totalSupply();

    const tx = bridgeContract.swap(owner.address, amount, signature);
    await expect(tx)
      .to.emit(bridgeContract, "SwapInitialized")
      .withArgs(owner.address, owner.address, amount, bigInt("0"), signature);

    const newBalanceOfSender = await bscToken.balanceOf(owner.address);
    const newTotalSupply = await bscToken.totalSupply();
    expect(balanceOfSender.sub(newBalanceOfSender)).to.eq(amount);
    expect(totalSupply.sub(newTotalSupply)).to.eq(amount);
  });

  it("Can't swap zero amount", async function () {
    const amount = utils.parseUnits("0", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(owner, msg);

    const tx = bridgeContract.swap(addr2.address, amount, signature);
    await expect(tx)
      .to.be.revertedWith("Amount must be greater than 0");
  });

  it("Can't swap with wrong signature", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(addr3, msg);

    const tx = bridgeContract.swap(addr2.address, amount, signature);
    await expect(tx)
      .to.be.revertedWith("Sender must sign message with private key");
  });

  it("Can redeem with good signature messages", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(owner, msg);
    const backendMsg = genBackendMessage(owner.address, addr2.address, amount, bigInt("1"), signature);

    const backendSign = await signMessage(backendSigner, backendMsg);

    const balanceOfRecepient = await bscToken.balanceOf(addr2.address);
    const totalSupply = await bscToken.totalSupply();

    await expect(bridgeContract.redeem(owner.address, addr2.address, amount, bigInt("1"), signature, backendSign))
      .to.emit(bridgeContract, "Redeemed")
      .withArgs(owner.address, addr2.address, amount);

    const newBalanceOfRecepient = await bscToken.balanceOf(addr2.address);
    const newTotalSupply = await bscToken.totalSupply();
    expect(newBalanceOfRecepient.sub(balanceOfRecepient)).to.eq(amount);
    expect(newTotalSupply.sub(totalSupply)).to.eq(amount);
  });

  it("Can't redeem same value twice", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(owner, msg);
    const backendMsg = genBackendMessage(owner.address, addr2.address, amount, bigInt("1"), signature);

    const backendSign = await signMessage(backendSigner, backendMsg);

    await bridgeContract.redeem(owner.address, addr2.address, amount, bigInt("1"), signature, backendSign);
    await expect(bridgeContract.redeem(owner.address, addr2.address, amount, bigInt("1"), signature, backendSign)).
      to.be.revertedWith("Transfer already processed");
  });

  it("Can't redeem with wrong backend signature message", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(addr1, msg);
    const backendMsg = genBackendMessage(addr1.address, addr2.address, amount, bigInt("1"), signature);
    const backendSign = await signMessage(owner, backendMsg);

    const tx = bridgeContract.redeem(addr1.address, addr2.address, amount, bigInt("1"), signature, backendSign);
    await expect(tx).to.be.revertedWith("Wrong signature from backend");
  });

  it("Can't redeem with wrong from address message", async function () {
    const amount = utils.parseUnits("10", 18);
    const msg = genMessage(addr2.address, amount);
    const signature = await signMessage(addr3, msg);
    const backendMsg = genBackendMessage(addr1.address, addr2.address, amount, bigInt("1"), signature);
    const backendSign = await signMessage(owner, backendMsg);

    const tx = bridgeContract.redeem(addr1.address, addr2.address, amount, bigInt("1"), signature, backendSign);
    await expect(tx).to.be.revertedWith("Wrong signature from backend");
  });
});
