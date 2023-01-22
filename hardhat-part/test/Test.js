const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { parseEther, formatEther } = require("ethers/lib/utils");
const { ethers, network } = require("hardhat");

/* describe("unit tests", () => {
  let DummyToken, dummyToken, TokenMarketplace, tokenMarketplace;
  beforeEach(async () => {
    DummyToken = await ethers.getContractFactory("DummyToken");
    dummyToken = await DummyToken.deploy();
    await dummyToken.deployed();
    TokenMarketplace = await ethers.getContractFactory("TokenMarketplace");
    tokenMarketplace = await TokenMarketplace.deploy({
      value: parseEther("200"),
    });

    await tokenMarketplace.deployed();
    const tx = await dummyToken.transfer(
      tokenMarketplace.address,
      parseEther("500000")
    );
    const tx1 = await tokenMarketplace.setPrice(dummyToken.address, 1);
  });
  it("Lets people buy", async () => {
    const [owner, user1] = await ethers.getSigners();

    const tx = await tokenMarketplace
      .connect(user1)
      .buy(dummyToken.address, parseEther("10"), { value: parseEther("10") });
    let balance = await dummyToken.balanceOf(user1.address);
    balance = await formatEther(balance.toString());
    await expect(balance.toString()).to.equal("10.0");
    let contractEthBalance = await ethers.provider.getBalance(
      tokenMarketplace.address
    );
    contractEthBalance = await formatEther(contractEthBalance.toString());
    expect(contractEthBalance.toString()).to.equal("210.0");
  });
  it("lets people sell", async () => {
    const [owner, user1] = await ethers.getSigners();

    await dummyToken.approve(tokenMarketplace.address, parseEther("10"));
    const tx = await tokenMarketplace.sell(
      dummyToken.address,
      parseEther("10")
    );
    let balance = await dummyToken.balanceOf(owner.address);
    balance = await formatEther(balance.toString());
    await expect(balance.toString()).to.equal("499990.0");
    let contractEthBalance = await ethers.provider.getBalance(owner.address);
    contractEthBalance = Math.round(
      await formatEther(contractEthBalance.toString())
    );
    expect(contractEthBalance.toString()).to.equal("9610");
  });
  it("lets only the owner change the price", async () => {
    const [owner, user1] = await ethers.getSigners();
    await expect(
      tokenMarketplace
        .connect(user1)
        .changePrice(dummyToken.address, parseEther("1"))
    ).to.be.revertedWith("You are not the owner");
  });
  it("let the owner change the price", async () => {
    const [owner, user1] = await ethers.getSigners();
    await tokenMarketplace.changePrice(dummyToken.address, parseEther("1"));
    let price = await tokenMarketplace.getPrice(dummyToken.address);
    price = await formatEther(price.toString());
    expect(price.toString()).to.equal("1.0");
  });
  it("cant add a price twice", async () => {
    await expect(
      tokenMarketplace.setPrice(dummyToken.address, parseEther("1"))
    ).to.be.revertedWith("There is already a price");
  });
  it("Will be reverted if there are no token available", async () => {
    await tokenMarketplace.changePrice(dummyToken.address, 0);

    const tx = await tokenMarketplace.buy(
      dummyToken.address,
      parseEther("500000")
    );
    await tx.wait();
    await expect(
      tokenMarketplace.buy(dummyToken.address, parseEther("10"))
    ).to.be.revertedWith("No token available");
  });
  it("will revert if there are not enough token available", async () => {
    await tokenMarketplace.changePrice(dummyToken.address, 0);
    await expect(
      tokenMarketplace.buy(dummyToken.address, parseEther("500001"))
    ).to.be.revertedWith("Not enough token available");
  });
});
 */

describe("unit tests", () => {
  async function deployFixture() {
    const interval = 300;

    const BASE_FEE = "250000000000000000";
    const GAS_PRICE_LINK = 1e9;
    const gasLane =
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";
    let subscriptionId = 588;

    const VRFCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    const vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(
      BASE_FEE,
      GAS_PRICE_LINK
    );
    await vrfCoordinatorV2Mock.deployed();

    const DummyToken = await ethers.getContractFactory("DummyToken");
    const dummyToken = await DummyToken.deploy();
    await dummyToken.deployed();
    const TokenMarketplace = await ethers.getContractFactory(
      "TokenMarketplace"
    );
    const tokenMarketplace = await TokenMarketplace.deploy({
      value: parseEther("2000"),
    });

    await tokenMarketplace.deployed();
    const tx = await dummyToken.transfer(
      tokenMarketplace.address,
      parseEther("500000")
    );
    const tx1 = await tokenMarketplace.setPrice(dummyToken.address, 1);

    const [owner] = await ethers.getSigners();
    const transactionCount = await owner.getTransactionCount();

    const futureAddress = ethers.utils.getContractAddress({
      from: owner.address,
      nonce: transactionCount + 1,
    });

    const ETFToken = await ethers.getContractFactory("ETFToken");
    const etfToken = await ETFToken.deploy(futureAddress);
    await etfToken.deployed();

    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      parseEther("20")
    );

    const sub = await vrfCoordinatorV2Mock.getSubscription("1");

    const ETFContract = await ethers.getContractFactory("ETFContract");
    const etfContract = await ETFContract.deploy(
      vrfCoordinatorV2Mock.address,
      etfToken.address,
      tokenMarketplace.address,
      interval,
      subscriptionId,
      gasLane,
      { value: parseEther("1000") }
    );
    let subId = Number(subscriptionId.toString());
    await etfContract.deployed();
    await vrfCoordinatorV2Mock.addConsumer(subId, etfContract.address);

    await dummyToken.transfer(tokenMarketplace.address, 10000);
    return {
      vrfCoordinatorV2Mock,
      TokenMarketplace,
      tokenMarketplace,
      DummyToken,
      dummyToken,
      ETFToken,
      etfToken,
      ETFContract,
      etfContract,
      interval,
    };
  }
  it("Should let a person make a proposal", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    console.log("eh");
    const tx = await etfContract.addProposal(
      dummyToken.address,
      parseEther("100"),
      true
    );
    await tx.wait();
    const currentProposal = await etfContract.getProposal(0);
    await expect(currentProposal.tokenAddress).to.equal(dummyToken.address);
  });
  it("Reverts if the contract doesnt have enough ETH to buy", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("1001"), true)
    ).to.be.revertedWith("There is not enough money to buy these token");
  });
  it("Reverts if the contract doesnt have enought token to sell", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("200"), false)
    ).to.be.revertedWith("There are not enough token to sell!");
  });
  it("Wont accept a proposal from someone who doesnt hold enough token", async () => {
    const { etfContract, dummyToken, etfToken } = await loadFixture(
      deployFixture
    );
    const [owner, user1] = await ethers.getSigners();
    const tx = await etfToken.transfer(user1.address, 99);
    await tx.wait();
    await expect(
      etfContract
        .connect(user1)
        .addProposal(dummyToken.address, parseEther("100"), true)
    ).to.be.revertedWith("You need to hold at least 100 token");
  });
  describe("after add a buy proposal", () => {
    async function proposeFixture() {
      const {
        vrfCoordinatorV2Mock,
        TokenMarketplace,
        tokenMarketplace,
        DummyToken,
        dummyToken,
        ETFToken,
        etfToken,
        ETFContract,
        etfContract,
        interval,
      } = await loadFixture(deployFixture);

      const tx = await etfContract.addProposal(
        dummyToken.address,
        parseEther("100"),
        true
      );
      return {
        vrfCoordinatorV2Mock,
        TokenMarketplace,
        tokenMarketplace,
        DummyToken,
        dummyToken,
        ETFToken,
        etfToken,
        ETFContract,
        etfContract,
        interval,
      };
    }
    it("wont let someone adding a proposal while a proposal is running", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      await expect(
        etfContract.addProposal(dummyToken.address, 200, false)
      ).to.be.revertedWith("There is already an ongoing proposal!");
    });
    it("let people vote", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const tx = await etfContract.voteOnProposal(0);
      let proposal = await etfContract.getProposal(0);
      await expect(proposal.yayVotes.toString()).to.equal("1");
    });
    it("wont let people without 100 token vote", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const [owner, user1] = await ethers.getSigners();
      await expect(
        etfContract.connect(user1).voteOnProposal(0)
      ).to.be.revertedWith("You need to hold at least 100 token");
    });
    it("wont let you vote twice", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const tx = await etfContract.voteOnProposal(0);
      await tx.wait();
      await expect(etfContract.voteOnProposal(1)).to.be.revertedWith(
        "You already voted"
      );
    });
    describe("after voting", () => {
      async function votedFixture() {
        const {
          vrfCoordinatorV2Mock,
          TokenMarketplace,
          tokenMarketplace,
          DummyToken,
          dummyToken,
          ETFToken,
          etfToken,
          ETFContract,
          etfContract,
          interval,
        } = await loadFixture(proposeFixture);

        const [owner, user1, user2, user3] = await ethers.getSigners();
        await etfToken.transfer(user1.address, 200);
        await etfToken.transfer(user2.address, 200);
        await etfToken.transfer(user3.address, 200);
        await etfContract.voteOnProposal(0);
        await etfContract.connect(user1).voteOnProposal(0);
        await etfContract.connect(user2).voteOnProposal(0);
        await etfContract.connect(user3).voteOnProposal(1);
        await network.provider.send("evm_increaseTime", [interval + 1]);
        await network.provider.request({ method: "evm_mine", params: [] });
        return {
          vrfCoordinatorV2Mock,
          TokenMarketplace,
          tokenMarketplace,
          DummyToken,
          dummyToken,
          ETFToken,
          etfToken,
          ETFContract,
          etfContract,
          interval,
        };
      }
      it("wont let people vote anymore after time passed", async () => {
        const { etfContract, etfToken } = await loadFixture(votedFixture);
        const [owner, user1, user2, user3, user4] = await ethers.getSigners();
        await etfToken.transfer(user4.address, 200);
        await expect(
          etfContract.connect(user4).voteOnProposal(0)
        ).to.be.revertedWith("The deadline already passed");
      });
      it("will execute if there are enough yes votes", async () => {
        const { etfContract, etfToken, dummyToken, vrfCoordinatorV2Mock } =
          await loadFixture(votedFixture);

        const [owner] = await ethers.getSigners();
        const sub = await vrfCoordinatorV2Mock.getSubscription("1");
        await vrfCoordinatorV2Mock.addConsumer(1, owner.address);
        const tx = await etfContract.performUpkeep("0x");
        await tx.wait();
        let balance = await dummyToken.balanceOf(etfContract.address);
        balance = formatEther(balance.toString());
        await expect(balance.toString()).to.equal("100.0");
      });
      it("can propose a new proposale after the old one is executed", async () => {
        const { etfContract, etfToken, dummyToken } = await loadFixture(
          votedFixture
        );
        const tx = await etfContract.performUpkeep("0x");
        await tx.wait();
        const tx1 = await etfContract.addProposal(
          dummyToken.address,
          parseEther("50"),
          false
        );
        const proposal = await etfContract.getProposal(1);
        await expect(
          formatEther(proposal.amount.toString()).toString()
        ).to.equal("50.0");
      });
      /* it("picks a winner, sents money and resets", async () => {
        const [owner, user1, user2, user3] = await ethers.getSigners();

        const { etfContract, etfToken, dummyToken, vrfCoordinatorV2Mock } =
          await loadFixture(votedFixture);

        let startingBalance = await user1.getBalance();
        let requestId = 1;
        await new Promise(async (resolve, rejects) => {
          etfContract.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!");
            try {
              const recentWinner = await etfContract.getRecentWinner();
              let winnerBalance = await user1.getBalance();
              winnerBalance = formatEther(winnerBalance.toString());
              startingBalance = formatEther(startingBalance.toString());
              let contractBalance = await ethers.provider.getBalance(
                etfContract.address
              );
              contractBalance = formatEther(contractBalance.toString());
              await expect(recentWinner).to.equal(user1.address);
              let reward = (contractBalance * 1) / 100;
              let result = winnerBalance - startingBalance;
              expect(winnerBalance - startingBalance).to.equal(
                Math.round(reward)
              );
              resolve();
            } catch (e) {
              rejects(e);
            }
          });
          const tx = await etfContract.performUpkeep("0x");
          const txReceipt = await tx.wait(1);

          await vrfCoordinatorV2Mock.fulfillRandomWords(
            txReceipt.events[2].args.requestId,
            etfContract.address
          );
        });
      }); */
    });
  });
  describe("after add a sell proposal", async () => {
    async function proposeSellFixture() {
      const {
        vrfCoordinatorV2Mock,
        TokenMarketplace,
        tokenMarketplace,
        DummyToken,
        dummyToken,
        ETFToken,
        etfToken,
        ETFContract,
        etfContract,
        interval,
      } = await loadFixture(deployFixture);
      await dummyToken.transfer(etfContract.address, parseEther("100"));
      const tx = await etfContract.addProposal(
        dummyToken.address,
        parseEther("100"),
        false
      );

      return {
        vrfCoordinatorV2Mock,
        TokenMarketplace,
        tokenMarketplace,
        DummyToken,
        dummyToken,
        ETFToken,
        etfToken,
        ETFContract,
        etfContract,
        interval,
      };
    }
    it("Shows that there is a sell proposal", async () => {
      const { etfContract, dummyToken } = await loadFixture(proposeSellFixture);
      const proposal = await etfContract.getProposal(0);
      await expect(proposal.buying).to.equal(false);
    });
    describe("after voting", () => {
      async function votedFixture() {
        const {
          vrfCoordinatorV2Mock,
          TokenMarketplace,
          tokenMarketplace,
          DummyToken,
          dummyToken,
          ETFToken,
          etfToken,
          ETFContract,
          etfContract,
          interval,
        } = await loadFixture(proposeSellFixture);

        const [owner, user1, user2, user3] = await ethers.getSigners();
        await etfToken.transfer(user1.address, 200);
        await etfToken.transfer(user2.address, 200);
        await etfToken.transfer(user3.address, 200);
        await etfContract.voteOnProposal(0);
        await etfContract.connect(user1).voteOnProposal(0);
        await etfContract.connect(user2).voteOnProposal(0);
        await etfContract.connect(user3).voteOnProposal(1);
        await network.provider.send("evm_increaseTime", [interval + 1]);
        await network.provider.request({ method: "evm_mine", params: [] });
        return {
          vrfCoordinatorV2Mock,
          TokenMarketplace,
          tokenMarketplace,
          DummyToken,
          dummyToken,
          ETFToken,
          etfToken,
          ETFContract,
          etfContract,
          interval,
        };
      }
      it("it will execute if there are enough yes votes", async () => {
        const {
          etfContract,
          etfToken,
          dummyToken,
          vrfCoordinatorV2Mock,
          tokenMarketplace,
        } = await loadFixture(votedFixture);

        const [owner] = await ethers.getSigners();
        const sub = await vrfCoordinatorV2Mock.getSubscription("1");
        await vrfCoordinatorV2Mock.addConsumer(1, owner.address);
        const tx = await dummyToken.approve(tokenMarketplace.address, 100);
        const tx1 = await etfContract.performUpkeep("0x");
        await tx1.wait();

        let tokenBalance = await dummyToken.balanceOf(etfContract.address);
        tokenBalance = formatEther(tokenBalance.toString());
        await expect(tokenBalance.toString()).to.equal("0.0");
        let ethBalance = await ethers.provider.getBalance(etfContract.address);
        ethBalance = formatEther(ethBalance.toString());
        await expect(ethBalance.toString()).to.equal("1100.0");
      });
      /*       it("picks a winner, sents money and resets", async () => {
        const [owner, user1, user2, user3] = await ethers.getSigners();

        const { etfContract, etfToken, dummyToken, vrfCoordinatorV2Mock } =
          await loadFixture(votedFixture);

        let startingBalance = await user1.getBalance();
        let requestId = 1;
        console.log("e");
        await new Promise(async (resolve, rejects) => {
          etfContract.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!");
            try {
              const recentWinner = await etfContract.getRecentWinner();
              let winnerBalance = await user1.getBalance();
              winnerBalance = formatEther(winnerBalance.toString());
              startingBalance = formatEther(startingBalance.toString());
              let contractBalance = await ethers.provider.getBalance(
                etfContract.address
              );
              contractBalance = formatEther(contractBalance.toString());
              await expect(recentWinner).to.equal(user1.address);
              let reward = (contractBalance * 1) / 100;
              let result = winnerBalance - startingBalance;
              expect(winnerBalance - startingBalance).to.equal(11);
              resolve();
            } catch (e) {
              rejects(e);
            }
          });
          const tx = await etfContract.performUpkeep("0x");
          const txReceipt = await tx.wait(1);
          await vrfCoordinatorV2Mock.fulfillRandomWords(
            txReceipt.events[4].args.requestId,
            etfContract.address
          );
        });
      }); */
    });
  });
});