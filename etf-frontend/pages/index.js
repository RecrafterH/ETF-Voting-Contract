import Head from "next/head";
import styles from "@/styles/Home.module.css";
import OldProposal from "./OldProposal";
import {
  Box,
  Text,
  Heading,
  Flex,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { Contract, ethers } from "ethers";
import {
  ADDRESS_DUMMYTOKEN,
  ABI_DUMMYTOKEN,
  ADDRESS_ETFTOKEN,
  ABI_ETFTOKEN,
  ADDRESS_ETFCONTRACT,
  ABI_ETFCONTRACT,
  ADDRESS_VRFMOCK,
  ABI_VRFMOCK,
} from "@/constants/constants";
import { useState, useEffect, useRef } from "react";
import Footer from "@/components/footer";
import { formatEther, parseEther } from "ethers/lib/utils";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentProposal, setCurrentProposal] = useState();
  const [radio, setRadio] = useState("");
  const [oldProposal, setOldProposal] = useState([]);
  const [searchProposal, setSearchProposal] = useState([]);
  const [recentWinner, setRecentWinner] = useState();
  const [ethBalance, setEthBalance] = useState("");
  const [days, setDays] = useState();
  const [hours, setHours] = useState();
  const [minutes, setMinutes] = useState();
  const [seconds, setSeconds] = useState();
  const ref = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);

  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    setWalletConnected(true);
  };

  const sendProposal = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = document.getElementById("inputAddress").value;
      let amount = document.getElementById("inputAmount").value;
      let func = document.getElementById("inputBuy").value;
      amount = parseEther(amount.toString());
      if (func == "option1") {
        func = true;
      } else if (func == "option2") {
        func = false;
      }
      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        signer
      );
      const tx = await etfContract.addProposal(address, amount, func);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      ref.current.value = "";

      ref1.current.value = "";
      ref2.current.value = "";
      getProposal();
    } catch (err) {
      console.error(err);
    }
  };
  const getProposal = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        provider
      );

      const proposal = await etfContract.getCurrentProposal();
      setCurrentProposal(proposal);
      document.getElementById("currentAddress").innerHTML =
        proposal.tokenAddress;
      document.getElementById("currentAmount").innerHTML = formatEther(
        proposal.amount.toString()
      );
      document.getElementById("currentDeadline").innerHTML =
        proposal.deadline.toString();
      document.getElementById("currentYayVotes").innerHTML =
        proposal.yayVotes.toString();
      document.getElementById("currentNayVotes").innerHTML =
        proposal.nayVotes.toString();
      if (proposal.buying == true) {
        document.getElementById("currentBuy").innerHTML = "Buying";
      } else if (proposal.buying == false) {
        document.getElementById("currentBuy").innerHTML = "Selling";
      }

      //console.log(ADDRESS_ETFCONTRACT);
      let balance = await provider.getBalance(ADDRESS_ETFCONTRACT);
      balance = formatEther(balance.toString());

      let time = await etfContract.getRemainingTime();
      time = Number(time);
      //console.log(time);
      setDays(Math.floor(time / 60 / 60 / 24));
      setHours(Math.floor((time / 60 / 60) % 24));
      setMinutes(Math.floor((time / 60) % 60));
      setSeconds(time % 60);

      setEthBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const vote = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        signer
      );
      const voted = Number(radio);
      const tx = await etfContract.voteOnProposal(voted);
      ref4.current.value = "";
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getProposal();
    } catch (error) {
      console.error(error);
    }
  };

  const getOldProposal = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);

      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        provider
      );
      const currentNumber = await etfContract.getProposalNum();
      const num = Number(currentNumber) - 1;
      const proposal = await etfContract.getOldProposal(num);
      const tokenAddress = proposal.tokenAddress;
      const amount = formatEther(proposal.amount.toString());
      let buying = proposal.buying;
      if (buying == true) {
        buying = "Buy";
      } else {
        buying = "Sell";
      }
      const nayVotes = proposal.nayVotes.toString();
      const yayVotes = proposal.yayVotes.toString();

      const propose = {
        tokenAddress,
        amount,
        buying,
        nayVotes,
        yayVotes,
      };
      setOldProposal([propose]);
    } catch (error) {
      console.error(error);
    }
  };

  const getSearchProposal = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);

      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        provider
      );
      const currentNumber = document.getElementById("searchNumber").value;
      const num = Number(currentNumber);
      const proposal = await etfContract.getOldProposal(num);
      const tokenAddress = proposal.tokenAddress;
      const amount = proposal.amount.toString();
      let buying = proposal.buying;
      if (buying == true) {
        buying = "Buy";
      } else {
        buying = "Sell";
      }
      const nayVotes = proposal.nayVotes.toString();
      const yayVotes = proposal.yayVotes.toString();

      const propose = {
        tokenAddress,
        amount,
        buying,
        nayVotes,
        yayVotes,
      };
      setSearchProposal([propose]);
      ref3.current.value = "0";
    } catch (error) {
      console.error(error);
    }
  };

  const getRecentWinner = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        provider
      );

      const winner = await etfContract.getRecentWinner();
      setRecentWinner(winner);
    } catch (error) {
      console.error(error);
    }
  };

  /*   const performUpkeep = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      let balance = await provider.getBalance(ADDRESS_ETFCONTRACT);
      balance = formatEther(balance.toString());
      console.log(balance);

      const signer = provider.getSigner();
      const etfContract = new Contract(
        ADDRESS_ETFCONTRACT,
        ABI_ETFCONTRACT,
        signer
      );

      const v2AggregatorContract = new Contract(
        ADDRESS_VRFMOCK,
        ABI_VRFMOCK,
        signer
      );

      let num = await etfContract.getProposalNum();
      num = Number(num) + 1;
      const tx = await etfContract.performUpkeep("0x");
      const txReceipt = await tx.wait();
      //txReceipt.events[4].args.requestId
      console.log(ADDRESS_ETFCONTRACT);
      await v2AggregatorContract.fulfillRandomWords(num, ADDRESS_ETFCONTRACT);
      getProposal();
      getOldProposal();
      getRecentWinner();
    } catch (error) {
      console.error(error);
    }
  }; */

  useEffect(() => {
    getProposal();
    getOldProposal();
    getRecentWinner();
  }, []);

  return (
    <Box margin="0" background="linear-gradient(54deg, #758fff, #2f2877)">
      <Head>
        <title>Homepage ETFDapp</title>
        <meta name="description" content="Created by Recrafter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Flex flexDir="row" justifyContent="space-between" margin="20px">
          <Heading color="white">ETF DAPP</Heading>
          <Button className={styles.button} onClick={connectWallet}>
            Connect Wallet
          </Button>
        </Flex>
      </header>
      <main className={styles.main}>
        <Box className={styles.start}>
          <Heading margin="30px">The first Token ETF</Heading>
          <Flex flexDir="column" justifyContent="center" textAlign="center">
            <a href="/#target">
              <Button backgroundColor="#2f2877" className={styles.button1}>
                Voting
              </Button>
            </a>
            <a href="/tokenShop">
              <Button backgroundColor="#2f2877" className={styles.button1}>
                Token Shop
              </Button>
            </a>
            <a href="/description">
              <Button backgroundColor="#2f2877" className={styles.button1}>
                Description
              </Button>
            </a>
            <a href="/roadmap">
              <Button backgroundColor="#2f2877" className={styles.button1}>
                RoadMap
              </Button>
            </a>
          </Flex>
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            You want us to buy or sell an asset? Fill out this form to make a
            proposal!
          </Text>
          <Box textAlign="center">
            <Box margin="30px">
              <label>Token Address:</label>
              <Input ref={ref} id="inputAddress" />
            </Box>
            <Box margin="30px">
              <label>Token Amount:</label>
              <Input ref={ref1} id="inputAmount" type="number" min={0.0001} />
            </Box>
            <Box margin="30px">
              <label>Token Amount:</label>
              <Select
                ref={ref2}
                id="inputBuy"
                placeholder="Select option"
                color="#64a3ff"
              >
                <option value="option1">buy</option>
                <option value="option2">sell</option>
              </Select>
            </Box>
            <Button
              onClick={sendProposal}
              textAlign="center"
              margin="30px"
              background-color="#b6c5d3"
              color="black"
              width="250px"
            >
              Send your Proposal
            </Button>
            <Text>ETH Balance: {ethBalance}</Text>
          </Box>
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            Ongoing proposal!
          </Text>
          <Box margin="20px" id="currentAddress"></Box>
          <Box margin="20px" id="currentAmount"></Box>
          <Box margin="20px" id="currentDeadline"></Box>
          <Box margin="20px" id="currentYayVotes"></Box>
          <Box margin="20px" id="currentNayVotes"></Box>
          <Box margin="20px" id="currentBuy"></Box>
          <Box margin="20px">
            {days} days {hours} hours {minutes} minutes {seconds} seconds
          </Box>

          <Button color="black" onClick={getProposal}>
            Get Proposal
          </Button>
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            <a id="target">Vote</a>
          </Text>
          <RadioGroup onChange={setRadio} value={radio}>
            <Stack direction="column">
              <Radio value="0">Yay</Radio>
              <Radio value="1">Nay</Radio>
            </Stack>
          </RadioGroup>
          <Button ref={ref4} margin="30px" color="black" onClick={vote}>
            Submit your Vote
          </Button>
          {/*           <Button
            ref={ref4}
            margin="30px"
            color="black"
            onClick={performUpkeep}
          >
            performUpkeep
          </Button> */}
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            Last Proposal
          </Text>
          <Box>
            {oldProposal.map((propose) => {
              return <OldProposal key={propose.tokenAddress} {...propose} />;
            })}
          </Box>
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            Recent Winner
          </Text>
          <Box>{recentWinner}</Box>
          <Button margin="30px" color="black" onClick={getRecentWinner}>
            get recent Winner
          </Button>
        </Box>
        <Box className={styles.voting}>
          <Text
            fontSize="25px"
            fontWeight="bold"
            textAlign="center"
            margin="30px"
          >
            Search for a proposal
          </Text>
          <Box margin="30px">
            <label margin="10px">
              Which proposalnumber are you looking for:
            </label>
            <NumberInput ref={ref3} margin="10px" id="searchNumber" min={0}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Box>
          <Button margin="30px" color="black" onClick={getSearchProposal}>
            search for proposal
          </Button>
          <Box>
            {searchProposal.map((propose) => {
              return (
                <OldProposal key={propose.tokenAddress + 1} {...propose} />
              );
            })}
          </Box>
        </Box>
      </main>
      <Footer />
    </Box>
  );
}
