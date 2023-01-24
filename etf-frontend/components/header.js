import styles from "@/styles/Home.module.css";
import { Flex, Heading } from "@chakra-ui/react";
const Header = () => {
  return (
    <header className={styles.header}>
      <Flex
        flexDir="row"
        justifyContent="space-between"
        margin="10px"
        alignContent="center"
      >
        <Heading color="white">ETF DAPP</Heading>
      </Flex>
    </header>
  );
};

export default Header;
