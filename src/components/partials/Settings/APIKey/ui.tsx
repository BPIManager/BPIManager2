import {
  Box,
  VStack,
  Text,
  Button,
  Stack,
  Icon,
  HStack,
  Input,
} from "@chakra-ui/react";
import { LuKey } from "react-icons/lu";

export default function ApiKeyUi() {
  return (
    <Box
      mt={4}
      p={6}
      bg="gray.900"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "start", md: "center" }}
        gap={6}
      >
        <VStack align="start" gap={1}>
          <HStack color="blue.400">
            <Icon as={LuKey} />
            <Text fontWeight="bold">APIキー</Text>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            API経由でBPIM2のデータを取得・更新します。(近日実装)
          </Text>
        </VStack>

        <HStack w={{ base: "full", md: "320px" }} gap={0}>
          <Input
            px={2}
            placeholder=""
            readOnly
            borderRightRadius={0}
            variant="subtle"
            fontSize="xs"
            bg="blackAlpha.400"
            borderColor="whiteAlpha.200"
          />
          <Button
            borderLeftRadius={0}
            colorPalette="blue"
            disabled
            variant="solid"
            px={4}
            flexShrink={0}
          >
            発行
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
}
