import { Flex, FlexProps } from "@chakra-ui/layout";
import { ReactNode } from "react";

interface IProps extends FlexProps {
    children: ReactNode;
}

export function IconButton({ children, ...props }: IProps) {
    return (
        <Flex
            as="button"
            w="2rem"
            h="2rem"
            rounded="base"
            justify="center"
            align="center"
            {...props}
        >
            {children}
        </Flex>
    );
}
