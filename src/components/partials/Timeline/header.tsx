import { Box, Grid, Text } from "@chakra-ui/react";

export const TimelineHeader = () => (
  <Grid
    templateColumns="auto 1fr"
    gap={3}
    px={3}
    py={2}
    borderBottom="1px solid"
    borderColor="whiteAlpha.100"
    bg="whiteAlpha.50"
    backdropFilter={"blur(10px)"}
    position="sticky"
    top="0"
    zIndex={1}
  >
    <Box w="32px" />
    <Grid templateColumns="28px 1.5fr 1fr 1fr 1.2fr" gap={1}>
      <HeaderText></HeaderText>
      <HeaderText textAlign="right">RIVAL</HeaderText>
      <HeaderText textAlign="right">GROWTH</HeaderText>
      <HeaderText textAlign="right">YOU</HeaderText>
      <HeaderText textAlign="right">DIFF</HeaderText>
    </Grid>
  </Grid>
);

const HeaderText = ({ children, ...props }: any) => (
  <Text
    fontSize="9px"
    fontWeight="bold"
    color="gray.500"
    letterSpacing="wider"
    {...props}
  >
    {children}
  </Text>
);
