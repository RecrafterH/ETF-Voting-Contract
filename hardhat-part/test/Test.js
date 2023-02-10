const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { parseEther, formatEther } = require("ethers/lib/utils");
const { ethers, network } = require("hardhat");

describe("unit tests ETFToken", () => {
  let ETFToken, etfToken;
  beforeEach(async () => {
    const [owner] = await ethers.getSigners();
    const transactionCount = await owner.getTransactionCount();
    const futureAddress = ethers.utils.getContractAddress({
      from: owner.address,
      nonce: transactionCount + 1,
    });

    ETFToken = await ethers.getContractFactory("ETFToken");
    etfToken = await ETFToken.deploy(futureAddress);
    await etfToken.deployed;
  });
  it("Will burn token every transaction", async () => {
    const [owner, user1] = await ethers.getSigners();
    await etfToken.transfer(user1.address, parseEther("100000"));
    let supply = await etfToken.totalSupply();
    supply = await formatEther(supply.toString());
    await expect(supply.toString()).to.equal("98000.0");
  });
  it("Won't let the sender spend more token as he has", async () => {
    const [onwer, user1, user2] = await ethers.getSigners();
    await etfToken.transfer(user1.address, parseEther("1000"));
    await expect(
      etfToken.connect(user1).transfer(user2.address, parseEther("961"))
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });
  it("Will execute the transferFrom function and applies the fees", async () => {
    const [owner, user1] = await ethers.getSigners();
    await etfToken.approve(user1.address, parseEther("1000"));
    await etfToken
      .connect(user1)
      .transferFrom(owner.address, user1.address, parseEther("1000"));
  });
  it("Will revert if the there is not enough allowance", async () => {
    const [owner, user1] = await ethers.getSigners();
    await expect(
      etfToken
        .connect(user1)
        .transferFrom(owner.address, user1.address, parseEther("1000"))
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });
});

describe("unit tests TokenMarketplace", () => {
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
  it("Let people buy", async () => {
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
  it("Let people sell", async () => {
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
  it("Let only the owner change the price", async () => {
    const [owner, user1] = await ethers.getSigners();
    await expect(
      tokenMarketplace
        .connect(user1)
        .changePrice(dummyToken.address, parseEther("1"))
    ).to.be.revertedWith("You are not the owner!");
  });
  it("Let the owner change the price", async () => {
    const [owner, user1] = await ethers.getSigners();
    await tokenMarketplace.changePrice(dummyToken.address, parseEther("1"));
    let price = await tokenMarketplace.getPrice(dummyToken.address);
    price = await formatEther(price.toString());
    expect(price.toString()).to.equal("1.0");
  });
  it("Can't add a price twice", async () => {
    await expect(
      tokenMarketplace.setPrice(dummyToken.address, parseEther("1"))
    ).to.be.revertedWith("There is already a price!");
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
    ).to.be.revertedWith("No token available!");
  });
  it("will revert if there are not enough token available", async () => {
    await tokenMarketplace.changePrice(dummyToken.address, 0);
    await expect(
      tokenMarketplace.buy(dummyToken.address, parseEther("500001"))
    ).to.be.revertedWith("Not enough token available!");
  });
});

describe("unit tests ETFContract", () => {
  async function deployFixture() {
    const interval = 60 * 60 * 24;

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
      parseEther("500")
    );
    const tx1 = await tokenMarketplace.setPrice(dummyToken.address, 1);

    const [owner] = await ethers.getSigners();

    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      parseEther("20")
    );

    const sub = await vrfCoordinatorV2Mock.getSubscription("1");
    const transactionCount = await owner.getTransactionCount();
    const futureAddress = ethers.utils.getContractAddress({
      from: owner.address,
      nonce: transactionCount + 1,
    });
    const ETFToken = await ethers.getContractFactory("ETFToken");
    const etfToken = await ETFToken.deploy(futureAddress);
    await etfToken.deployed();

    const ETFContract = await ethers.getContractFactory("ETFContract");
    const etfContract = await ETFContract.deploy(
      vrfCoordinatorV2Mock.address,
      etfToken.address,
      tokenMarketplace.address,
      subscriptionId,
      gasLane,
      { value: parseEther("1000") }
    );
    let subId = Number(subscriptionId.toString());
    await etfContract.deployed();
    await vrfCoordinatorV2Mock.addConsumer(subId, etfContract.address);

    await etfToken.transfer(tokenMarketplace.address, parseEther("10000"));
    await tokenMarketplace.setPrice(etfToken.address, 1);

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
  it("Sends money to the etfContraft from every transaction of etfToken", async () => {
    const { etfContract, etfToken } = await loadFixture(deployFixture);
    const [owner, user1] = await ethers.getSigners();
    const tx = await etfToken.transfer(user1.address, parseEther("10000"));
    await tx.wait();
    let balance = await etfToken.balanceOf(etfContract.address);
    balance = formatEther(balance.toString());
    await expect(balance.toString()).to.equal("400.0");
  });
  it("Should revert if the marketplace doesn't have enough token to buy", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("501"), true)
    ).to.be.revertedWithCustomError(
      etfContract,
      "ETFContract__NotEnoughTokenToBuy"
    );
  });
  it("Should revert if the marketplace doesn't have enough eth to buy our tokens", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await dummyToken.transfer(etfContract.address, parseEther("5000"));
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("5000"), false)
    ).to.be.revertedWithCustomError(
      etfContract,
      "ETFContract__MarketplaceDoesntHaveEnoughETH"
    );
  });
  it("Should let a person make a proposal", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    const tx = await etfContract.addProposal(
      dummyToken.address,
      parseEther("100"),
      true
    );
    await tx.wait();
    const currentProposal = await etfContract.getCurrentProposal();
    await expect(currentProposal.tokenAddress).to.equal(dummyToken.address);
  });
  it("Reverts if the contract doesn't have enough ETH to buy", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("1001"), true)
    ).to.be.revertedWithCustomError(
      etfContract,
      "ETFContract__NotEnoughEthInContract"
    );
  });
  it("Reverts if the contract doesn't have enought token to sell", async () => {
    const { etfContract, dummyToken } = await loadFixture(deployFixture);
    await expect(
      etfContract.addProposal(dummyToken.address, parseEther("200"), false)
    ).to.be.revertedWithCustomError(
      etfContract,
      "ETFContract__NotEnoughTokenToSell"
    );
  });
  it("Wont accept a proposal from someone who doesn't hold enough token", async () => {
    const { etfContract, dummyToken, etfToken } = await loadFixture(
      deployFixture
    );
    const [owner, user1] = await ethers.getSigners();
    const tx = await etfToken.transfer(user1.address, parseEther("0.009"));
    await tx.wait();
    await expect(
      etfContract
        .connect(user1)
        .addProposal(dummyToken.address, parseEther("100"), true)
    ).to.be.revertedWithCustomError(
      etfContract,
      "ETFContract__HoldingNotEnoughETFToken"
    );
  });
  describe("After adding a buy proposal", () => {
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
    it("Choose the winner if only 1 person has voted", async () => {
      const {
        dummyToken,
        etfContract,
        interval,
        etfToken,
        vrfCoordinatorV2Mock,
      } = await loadFixture(proposeFixture);
      const [owner, user1] = await ethers.getSigners();
      await etfContract.voteOnProposal(1);
      await etfToken.transfer(user1.address, parseEther("100"));
      await network.provider.send("evm_increaseTime", [interval + 1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      await etfContract.performUpkeep("0x");

      await vrfCoordinatorV2Mock.fulfillRandomWords("1", etfContract.address);
      const winner = await etfContract.getRecentWinner();
      await expect(winner).to.equal(owner.address);
    });
    it("wont let someone adding a proposal while a proposal is running", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      await expect(
        etfContract.addProposal(dummyToken.address, 200, false)
      ).to.be.revertedWithCustomError(
        etfContract,
        "ETFContract__ProposalIsStillOngoing"
      );
    });
    it("Let people vote", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const tx = await etfContract.voteOnProposal(0);
      let proposal = await etfContract.getCurrentProposal();
      await expect(proposal.yayVotes.toString()).to.equal("1");
    });
    it("Wont let people without 100 token vote", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const [owner, user1] = await ethers.getSigners();
      await expect(
        etfContract.connect(user1).voteOnProposal(0)
      ).to.be.revertedWithCustomError(
        etfContract,
        "ETFContract__HoldingNotEnoughETFToken"
      );
    });
    it("Wont let you vote twice", async () => {
      const { dummyToken, etfContract } = await loadFixture(proposeFixture);
      const tx = await etfContract.voteOnProposal(0);
      await tx.wait();
      await expect(etfContract.voteOnProposal(1)).to.be.revertedWithCustomError(
        etfContract,
        "ETFContract__YouAlreadyVoted"
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
        await etfToken.transfer(user1.address, parseEther("0.02"));
        await etfToken.transfer(user2.address, parseEther("0.02"));
        await etfToken.transfer(user3.address, parseEther("0.02"));
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
      it("Wont buy and wont revert if there aren't enough token anymore", async () => {
        const {
          etfContract,
          dummyToken,
          tokenMarketplace,
          vrfCoordinatorV2Mock,
        } = await loadFixture(votedFixture);
        await tokenMarketplace.buy(dummyToken.address, parseEther("500"), {
          value: parseEther("500"),
        });
        await etfContract.performUpkeep("0x");

        await vrfCoordinatorV2Mock.fulfillRandomWords(1, etfContract.address);
        let balance = await dummyToken.balanceOf(etfContract.address);
        balance = formatEther(balance.toString());
        await expect(balance.toString()).to.equal("0.0");
      });
      it("Wont let people vote anymore after time passed", async () => {
        const { etfContract, etfToken } = await loadFixture(votedFixture);
        const [owner, user1, user2, user3, user4] = await ethers.getSigners();
        await etfToken.transfer(user4.address, parseEther("0.02"));
        await expect(
          etfContract.connect(user4).voteOnProposal(0)
        ).to.be.revertedWithCustomError(
          etfContract,
          "ETFContract__ProposalHasEnded"
        );
      });
      it("Will execute if there are enough yes votes", async () => {
        const { etfContract, dummyToken, vrfCoordinatorV2Mock } =
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
      it("Can propose a new proposale after the old one is executed", async () => {
        const { etfContract, dummyToken } = await loadFixture(votedFixture);
        const tx = await etfContract.performUpkeep("0x");
        await tx.wait();
        await etfContract.addProposal(
          dummyToken.address,
          parseEther("50"),
          false
        );
        const proposal = await etfContract.getCurrentProposal();
        await expect(
          formatEther(proposal.amount.toString()).toString()
        ).to.equal("50.0");
      });
      it("Picks a winner, sends money and resets", async () => {
        const [owner, user1] = await ethers.getSigners();

        const { etfContract, vrfCoordinatorV2Mock } = await loadFixture(
          votedFixture
        );
        let contractBalance = await ethers.provider.getBalance(
          etfContract.address
        );
        contractBalance = formatEther(contractBalance.toString());
        let reward =
          ((contractBalance - 100 - (contractBalance * 1) / 100) * 1) / 100;
        let startingBalance = await user1.getBalance();
        await new Promise(async (resolve, rejects) => {
          etfContract.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!");
            try {
              const recentWinner = await etfContract.getRecentWinner();
              let winnerBalance = await user1.getBalance();
              winnerBalance = formatEther(winnerBalance.toString());
              startingBalance = formatEther(startingBalance.toString());

              await expect(recentWinner).to.equal(user1.address);

              let result = winnerBalance - startingBalance;
              expect(
                Math.round((winnerBalance - startingBalance) * 10) / 10
              ).to.equal(reward);
              resolve();
            } catch (e) {
              rejects(e);
            }
          });
          await etfContract.performUpkeep("0x");

          await vrfCoordinatorV2Mock.fulfillRandomWords(1, etfContract.address);
        });
      });
    });
  });
  describe("After adding a sell proposal", async () => {
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
      const { etfContract } = await loadFixture(proposeSellFixture);
      const proposal = await etfContract.getCurrentProposal();
      await expect(proposal.buying).to.equal(false);
    });
    describe("After voting", () => {
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
        await etfToken.transfer(user1.address, parseEther("0.02"));
        await etfToken.transfer(user2.address, parseEther("0.02"));
        await etfToken.transfer(user3.address, parseEther("0.02"));
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
      it("Wont sell and wont revert if there aren't enough eth anymore in the marketplace", async () => {
        const {
          etfContract,
          dummyToken,
          tokenMarketplace,
          vrfCoordinatorV2Mock,
        } = await loadFixture(votedFixture);

        await dummyToken.approve(tokenMarketplace.address, parseEther("2000"));
        await tokenMarketplace.sell(dummyToken.address, parseEther("2000"));
        await etfContract.performUpkeep("0x");

        await vrfCoordinatorV2Mock.fulfillRandomWords(1, etfContract.address);
        let balance = await ethers.provider.getBalance(etfContract.address);
        balance = formatEther(balance.toString());
        await expect(balance.toString()).to.equal("980.1");
      });
      it("It will execute if there are enough yes votes", async () => {
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
        const tx1 = await etfContract.performUpkeep("0x");
        await tx1.wait();
        await vrfCoordinatorV2Mock.fulfillRandomWords(1, etfContract.address);

        let tokenBalance = await dummyToken.balanceOf(etfContract.address);
        tokenBalance = formatEther(tokenBalance.toString());
        await expect(tokenBalance.toString()).to.equal("0.0");
        let ethBalance = await ethers.provider.getBalance(etfContract.address);
        ethBalance = formatEther(ethBalance.toString());
        await expect(ethBalance.toString()).to.equal("1078.11");
        let etfTokenBalance = await etfToken.balanceOf(etfContract.address);
        etfTokenBalance = await formatEther(etfTokenBalance.toString());
        await expect(etfTokenBalance.toString()).to.equal("210.7812");
      });
      it("Picks a winner, sents money and resets", async () => {
        const [owner, user1] = await ethers.getSigners();

        const { etfContract, vrfCoordinatorV2Mock } = await loadFixture(
          votedFixture
        );

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
              expect(
                Math.round((winnerBalance - startingBalance) * 10000) / 10000
              ).to.equal(10.89);
              resolve();
            } catch (e) {
              rejects(e);
            }
          });
          const tx = await etfContract.performUpkeep("0x");
          await vrfCoordinatorV2Mock.fulfillRandomWords(1, etfContract.address);
        });
      });
    });
  });
});
