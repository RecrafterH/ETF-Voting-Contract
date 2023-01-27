import styles from "@/styles/Home.module.css";
import Head from "next/head";
import {
  Box,
  Text,
  Flex,
  Heading,
  Button,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import Footer from "@/components/footer";
import { Contract, ethers } from "ethers";
import { useEffect, useState, useRef } from "react";
import {
  ADDRESS_TOKENMARKETPLACE,
  ABI_TOKENMARKETPLACE,
  ADDRESS_ETFTOKEN,
  ABI_ETFTOKEN,
} from "@/constants/constants";
import { formatEther, parseEther } from "ethers/lib/utils";

const Shop = () => {
  const [walletConnected, setWalletConnected] = useState();
  const [ethBalance, setEthBalance] = useState();
  const [tokenBalance, setTokenBalance] = useState();
  const [tokenPrice, setTokenPrice] = useState();
  const [totalTokenPrice, setTotalTokenPrice] = useState(0);
  const ref = useRef(null);

  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    setWalletConnected(true);
  };

  const getBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = signer.getAddress();

      const etfTokenContract = new Contract(
        ADDRESS_ETFTOKEN,
        ABI_ETFTOKEN,
        provider
      );
      let balance = await etfTokenContract.balanceOf(address);
      balance = Math.round(formatEther(balance.toString()) * 1000000) / 1000000;
      setTokenBalance(balance);
    } catch (error) {
      console.error(error);
    }
  };

  const getETHBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      let balance = await provider.getBalance(address);
      balance = Math.round(formatEther(balance.toString()) * 1000000) / 1000000;
      setEthBalance(balance);
    } catch (error) {
      console.error(error);
    }
  };

  const getTokenPrice = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    await provider.send("eth_requestAccounts", []);
    const marketplaceContract = new Contract(
      ADDRESS_TOKENMARKETPLACE,
      ABI_TOKENMARKETPLACE,
      provider
    );
    let price = await marketplaceContract.getPrice(ADDRESS_ETFTOKEN);

    setTokenPrice(price.toString());
  };

  const givePrice = async (value) => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const marketplaceContract = new Contract(
        ADDRESS_TOKENMARKETPLACE,
        ABI_TOKENMARKETPLACE,
        provider
      );

      //let amount = formatEther(value.toString());
      let totalAmount = await marketplaceContract.getTotalPrice(
        ADDRESS_ETFTOKEN,
        parseEther(value.toString())
      );
      totalAmount = formatEther(totalAmount.toString());
      setTotalTokenPrice(totalAmount);
    } catch (error) {
      console.error(error);
    }
  };

  const buyToken = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        "any"
      );
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      let amount = document.getElementById("inputAmount").value;

      const marketplaceContract = new Contract(
        ADDRESS_TOKENMARKETPLACE,
        ABI_TOKENMARKETPLACE,
        signer
      );
      const value = await marketplaceContract.getTotalPrice(
        ADDRESS_ETFTOKEN,
        parseEther(amount.toString())
      );
      const tx = await marketplaceContract.buy(
        ADDRESS_ETFTOKEN,
        parseEther(amount.toString()),
        { value: value }
      );
      await tx.wait();
      ref.current.value = "";
      getBalance();
      getETHBalance();
      setTotalTokenPrice(0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getBalance();
    getETHBalance();
    getTokenPrice();
  }, []);

  return (
    <Box margin="0" background="linear-gradient(54deg, #758fff, #2f2877)">
      <Head>
        <title>TokenShop ETDDapp</title>
        <meta name="description" content="Created by Recrafter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className={styles.header}>
        <Flex flexDir="row" justifyContent="space-between" margin="20px">
          <Heading color="white">ETF DAPP</Heading>

          <Box>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<HamburgerIcon />}
                variant="outline"
                background="white"
              >
                Open menu
              </MenuButton>
              <MenuList>
                <MenuItem as="a" href="/">
                  Home
                </MenuItem>
                <MenuItem as="a" href="/#target">
                  Voting
                </MenuItem>
                <MenuItem as="a" href="/tokenShop">
                  TokenShop
                </MenuItem>
                <MenuItem as="a" href="/description">
                  Description
                </MenuItem>
                <MenuItem as="a" href="/roadmap">
                  Roadmap
                </MenuItem>
              </MenuList>
            </Menu>
            <Button
              className={styles.button}
              onClick={connectWallet}
              marginLeft="30px"
            >
              Connect Wallet
            </Button>
          </Box>
        </Flex>
      </header>
      <Box className={styles.voting}>
        <Text
          fontSize="25px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          TokenShop
        </Text>
        <Flex flexDir="column" justifyContent="center" textAlign="center">
          <Box border="1px solid #989acd" borderRadius="8px">
            <Text>Your Balances</Text>
            <Text>ETFToken: {tokenBalance}</Text>
            <Text>ETH: {ethBalance}</Text>
          </Box>
          <Box margin="30px">
            <label>Token Amount:</label>
            <Input
              ref={ref}
              id="inputAmount"
              min={0.0001}
              onChange={(e) => givePrice(e.target.value)}
            />
          </Box>
          <Box border="1px solid #989acd" borderRadius="8px" margin="10px">
            <Text>1 Token costs {tokenPrice} ETH</Text>
          </Box>
          <Box border="1px solid #989acd" borderRadius="8px" margin="10px">
            <Text>1 Token costs {totalTokenPrice} ETH</Text>
          </Box>
          <Box>
            <Button
              onClick={buyToken}
              textAlign="center"
              margin="30px"
              background-color="#b6c5d3"
              color="black"
              width="250px"
            >
              Buy Token
            </Button>
          </Box>
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

export default Shop;
