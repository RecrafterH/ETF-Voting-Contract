import styles from "@/styles/Home.module.css";
import {
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
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
      </Flex>
    </header>
  );
};

export default Header;
