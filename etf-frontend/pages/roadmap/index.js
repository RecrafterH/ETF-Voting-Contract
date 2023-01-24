import styles from "@/styles/Home.module.css";
import { Box, Text, Flex } from "@chakra-ui/react";
import Header from "@/components/header";
import Footer from "@/components/footer";

const Roadmap = () => {
  return (
    <Box margin="0" background="linear-gradient(54deg, #758fff, #2f2877)">
      <Header />
      <Box className={styles.voting}>
        <Text
          fontSize="25px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          Q1 2023
        </Text>
        <Flex>
          <ul>
            <li>Extanding Team</li>
            <li>Negotiations with Investors</li>
            <li>Staking for our holders</li>
            <li>First NFT Collection</li>
            <li>Second NFT Collection</li>
            <li>Building our first App</li>
          </ul>
        </Flex>
      </Box>
      <Box className={styles.voting}>
        <Text
          fontSize="25px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          Q2 2023
        </Text>
        <Flex>
          <ul>
            <li>Extanding Team</li>
            <li>Negotiations with Investors</li>
            <li>Staking for our holders</li>
            <li>First NFT Collection</li>
            <li>Second NFT Collection</li>
            <li>Building our first App</li>
          </ul>
        </Flex>
      </Box>
      <Box className={styles.voting}>
        <Text
          fontSize="25px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          Q3 2023
        </Text>
        <Flex>
          <ul>
            <li>Extanding Team</li>
            <li>Negotiations with Investors</li>
            <li>Staking for our holders</li>
            <li>First NFT Collection</li>
            <li>Second NFT Collection</li>
            <li>Building our first App</li>
          </ul>
        </Flex>
      </Box>
      <Box className={styles.voting}>
        <Text
          fontSize="25px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          Q4 2023
        </Text>
        <Flex>
          <ul>
            <li>Extanding Team</li>
            <li>Negotiations with Investors</li>
            <li>Staking for our holders</li>
            <li>First NFT Collection</li>
            <li>Second NFT Collection</li>
            <li>Building our first App</li>
          </ul>
        </Flex>
      </Box>
      <Footer />
    </Box>
  );
};

export default Roadmap;
