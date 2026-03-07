import { Box, Link, Text } from "@chakra-ui/react";

export const NoDataAlert = ({ data }: { data?: any[] }) => {
  return (
    <Box
      my={4}
      p={5}
      bg="#0d1117"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      w="full"
      _focus={{ outline: "none" }}
    >
      <b>おっと！まだデータが登録されていないようです...</b>
      <Text fontSize={"sm"} mt={2}>
        「
        <Link textDecoration={"underline"} href="/import">
          インポート
        </Link>
        」から今すぐデータを登録するか、今までBPIManagerを使っていた場合は「
        <Link textDecoration={"underline"} href="/settings">
          データを移行
        </Link>
        」することができます!
      </Text>
    </Box>
  );
};
