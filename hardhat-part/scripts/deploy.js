const { parseEther } = require("ethers/lib/utils");
const { network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

const FUND_AMOUNT = parseEther("20");

const main = async () => {
  const DummyToken = await ethers.getContractFactory("DummyToken");
  const dummyToken = await DummyToken.deploy();
  await dummyToken.deployed();
  const TokenMarketplace = await ethers.getContractFactory("TokenMarketplace");
  const tokenMarketplace = await TokenMarketplace.deploy({
    value: parseEther("0.1"),
  });

  await tokenMarketplace.deployed();
  const tx = await dummyToken.transfer(
    tokenMarketplace.address,
    parseEther("500000")
  );
  const tx1 = await tokenMarketplace.setPrice(dummyToken.address, 1);
  await tx1.wait();
  const [owner] = await ethers.getSigners();
  const transactionCount = await owner.getTransactionCount();

  const futureAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: transactionCount + 1,
  });

  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

  if (chainId == 31337) {
    const BASE_FEE = "250000000000000000";
    const GAS_PRICE_LINK = 1e9;
    VRFCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(
      BASE_FEE,
      GAS_PRICE_LINK
    );
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    console.log("vrfCoordinator: ", vrfCoordinatorV2Address);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }
  console.log(vrfCoordinatorV2Address);
  console.log(subscriptionId);

  const ETFToken = await ethers.getContractFactory("ETFToken");
  const etfToken = await ETFToken.deploy(futureAddress);
  await etfToken.deployed();

  const ETFContract = await ethers.getContractFactory("ETFContract");
  const etfContract = await ETFContract.deploy(
    vrfCoordinatorV2Address,
    etfToken.address,
    tokenMarketplace.address,
    subscriptionId,
    networkConfig[chainId]["gasLane"],
    { value: parseEther("0.4") }
  );

  await etfToken.transfer(tokenMarketplace.address, parseEther("10000"));
  await tokenMarketplace.setPrice(etfToken.address, 1);

  //await vrfCoordinatorV2Mock.addConsumer(subscriptionId, etfContract.address);

  console.log("dummyToken deployed at: ", dummyToken.address);
  console.log("tokenmarketplace deployed at: ", tokenMarketplace.address);
  console.log("etfToken deployed at: ", etfToken.address);
  console.log("etfContract deployed at: ", etfContract.address);
};

//dummyToken deployed at:  0x03Cd86FF5A93529bd3856FCA29601B6F32b2cD7b
//tokenmarketplace deployed at:  0x4E20202F43c99A04A3dC997a10ea80055E934071
//etfToken deployed at:  0x8955e04779473FC5F4825e3248688a2b0649c908
//etfContract deployed at:  0x061c15819c00DbDCDf1F8abbFDB1989E17222062

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
