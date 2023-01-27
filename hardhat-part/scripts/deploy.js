const { parseEther } = require("ethers/lib/utils");
const { network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

const FUND_AMOUNT = parseEther("20"); // 1 Ether, or 1e18 (10^18) Wei

const main = async () => {
  const DummyToken = await ethers.getContractFactory("DummyToken");
  const dummyToken = await DummyToken.deploy();
  await dummyToken.deployed();
  const TokenMarketplace = await ethers.getContractFactory("TokenMarketplace");
  const tokenMarketplace = await TokenMarketplace.deploy({
    value: parseEther("100"),
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
    console.log("vrfCoordinator: ", vrfCoordinatorV2Mock.address);
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
    vrfCoordinatorV2Mock.address,
    etfToken.address,
    tokenMarketplace.address,
    subscriptionId,
    networkConfig[chainId]["gasLane"],
    { value: parseEther("100") }
  );

  //yarn hardhat verify --contract contracts/ETFContract.sol:ETFContract --network goerli 0x53df2522F47b863Df74Cc6b8A557D873Af2d5b45 "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D" "0x5cB104D84B8Ccf570C331F2b9C53BD24b7eb4Abd" "0x705E21B25D53C987c71d878d1D241235370E184D" "9083" "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15"

  await etfToken.transfer(tokenMarketplace.address, parseEther("10000"));
  await tokenMarketplace.setPrice(etfToken.address, 1);

  await etfToken.transfer(
    "0x2Df3EBe4280dC7262D9644ccd5dBC41c0DE293c8",
    parseEther("100")
  );

  await etfToken.transfer(
    "0xc3974256C8bE7e81E6B3e92e7BC6A28a667b769A",
    parseEther("100")
  );

  await vrfCoordinatorV2Mock.addConsumer(subscriptionId, etfContract.address);

  console.log("dummyToken deployed at: ", dummyToken.address);
  console.log("tokenmarketplace deployed at: ", tokenMarketplace.address);
  console.log("etfToken deployed at: ", etfToken.address);
  console.log("etfContract deployed at: ", etfContract.address);
};

//dummyToken deployed at:  0x816a54423C07DDE379fc29fBA721b6942a47eB84
//tokenmarketplace deployed at:  0x705E21B25D53C987c71d878d1D241235370E184D
//etfToken deployed at:  0x5cB104D84B8Ccf570C331F2b9C53BD24b7eb4Abd
//etfContract deployed at:  0x53df2522F47b863Df74Cc6b8A557D873Af2d5b45

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
