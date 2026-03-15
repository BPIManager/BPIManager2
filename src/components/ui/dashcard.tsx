import { Box, BoxProps } from "@chakra-ui/react";

export const DashCard = ({ children, ...props }: BoxProps) => (
  <Box
    p={5}
    bg="#0d1117"
    borderRadius="xl"
    borderWidth="1px"
    borderColor="whiteAlpha.100"
    w="full"
    {...props}
  >
    {children}
  </Box>
);
