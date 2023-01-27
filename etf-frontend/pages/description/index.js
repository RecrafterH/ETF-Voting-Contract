import styles from "@/styles/Home.module.css";
import Head from "next/head";
import { Box, Text, Heading, Flex } from "@chakra-ui/react";
import Header from "@/components/header";
import Footer from "@/components/footer";

const AboutUs = () => {
  return (
    <Box margin="0" background="linear-gradient(54deg, #758fff, #2f2877)">
      <Head>
        <title>Description ETDDapp</title>
        <meta name="description" content="Created by Recrafter" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Box className={styles.voting} padding="70px">
        <Text
          fontSize="35px"
          fontWeight="bold"
          textAlign="center"
          margin="30px"
        >
          Our Mission
        </Text>
        <Flex flexDir="column">
          <Heading margin="40px" textAlign="center">
            Text 1
          </Heading>
          <Text>
            Section 1.10.32 of "de Finibus Bonorum et Malorum", written by
            Cicero in 45 BC "Sed ut perspiciatis unde omnis iste natus error sit
            voluptatem accusantium doloremque laudantium, totam rem aperiam,
            eaque ipsa quae ab illo inventore veritatis et quasi architecto
            beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia
            voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
            magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
            quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur,
            adipisci velit, sed quia non numquam eius modi tempora incidunt ut
            labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad
            minima veniam, quis nostrum exercitationem ullam corporis suscipit
            laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem
          </Text>
          <Heading margin="40px" textAlign="center">
            Text 2
          </Heading>
          <Text>
            vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil
            molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas
            nulla pariatur?" 1914 translation by H. Rackham "But I must explain
            to you how all this mistaken idea of denouncing pleasure and
            praising pain was born and I will give you a complete account of the
            system, and expound the actual teachings of the great explorer of
            the truth, the master-builder of human happiness. No one rejects,
            dislikes, or avoids pleasure itself, because it is pleasure, but
            because those who do not know how to pursue pleasure rationally
            encounter consequences that are extremely painful. Nor again is
            there anyone who loves or pursues or desires to obtain pain of
            itself, because it is pain, but because occasionally circumstances
            occur in which toil and pain can procure him some great pleasure. To
            take a trivial example, which of us ever undertakes laborious
            physical exercise, except to obtain some advantage from it? But who
            has any right to find fault with a man who chooses to enjoy a
            pleasure that has no annoying consequences, or one who avoids a pain
            that produces no resultant pleasure?"
          </Text>
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

export default AboutUs;
