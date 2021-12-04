import { Flex, Text } from "@chakra-ui/layout";
import BrandLogo from "domains/common/components/styles/BrandLogo";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { MeContext } from "../contexts";

export default function Navbar() {
    const { me } = useContext(MeContext);
    return (
        <Flex
            as="nav"
            boxShadow="elevate.bottom"
            bgColor="gray.800"
            zIndex={1000}
            alignItems="center"
            py="0.5rem"
            px="1rem"
        >
            <Link to="/">
                <BrandLogo />
            </Link>
            {me && (
                <Text as="h3" ml="auto" color={`${me.color}.600`}>
                    {me.username}
                </Text>
            )}
        </Flex>
    );
}
