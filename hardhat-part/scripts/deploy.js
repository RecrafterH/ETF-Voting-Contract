const { parseEther } = require("ethers/lib/utils");
const { network, ethers } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");

const FUND_AMOUNT = parseEther("20"); // 1 Ether, or 1e18 (10^18) Wei

const main = async () => {
  const DummyToken = await ethers.getContractFactory("DummyToken");
  const dummyToken = await DummyToken.deploy();
  await dummyToken.deployed();
  const TokenMarketplace = await ethers.getContractFactory("TokenMarketplace");
  const tokenMarketplace = await TokenMarketplace.deploy({
    value: parseEther("500"),
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

  const ETFToken = await ethers.getContractFactory("ETFToken");
  const etfToken = await ETFToken.deploy(futureAddress);
  await etfToken.deployed();

  const tx3 = await etfToken.transfer(
    tokenMarketplace.address,
    parseEther("10000")
  );
  const tx4 = await tokenMarketplace.setPrice(etfToken.address, 1);
  await tx4.wait();

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
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const tx2 = await etfToken.transfer(
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    parseEther("100")
  );

  const ETFContract = await ethers.getContractFactory("ETFContract");
  const etfContract = await ETFContract.deploy(
    vrfCoordinatorV2Mock.address,
    etfToken.address,
    tokenMarketplace.address,
    subscriptionId,
    networkConfig[chainId]["gasLane"],
    { value: parseEther("500") }
  );

  await vrfCoordinatorV2Mock.addConsumer(subscriptionId, etfContract.address);
  console.log("vrfCoordinator: ", vrfCoordinatorV2Mock.address);
  console.log("dummyToken deployed at: ", dummyToken.address);
  console.log("tokenmarketplace deployed at: ", tokenMarketplace.address);
  console.log("etfToken deployed at: ", etfToken.address);
  console.log("etfContract deployed at: ", etfContract.address);
};

//dummyToken deployed at:  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
//tokenmarketplace deployed at:  0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
//etfToken deployed at:  0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
//etfContract deployed at:  0x610178dA211FEF7D417bC0e6FeD39F05609AD788

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
