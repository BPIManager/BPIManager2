import {
  Center,
  VStack,
  Box,
  Heading,
  Text,
  Button,
  Code,
} from "@chakra-ui/react";
import { AlertCircle } from "lucide-react";
import { LuRefreshCcw } from "react-icons/lu";

export const LogErrorState = ({
  error,
  onRetry,
}: {
  error: any;
  onRetry: () => void;
}) => {
  const status = error?.status;
  const message =
    error?.info?.message || error?.message || "通信エラーが発生しました";

  return (
    <Center h="500px">
      <VStack gap={6} textAlign="center">
        <Box color="red.500" bg="red.500/10" p={6} borderRadius="full">
          <AlertCircle size={48} />
        </Box>

        <VStack gap={2}>
          <Heading size="md" color="white">
            データの取得に失敗しました
          </Heading>
          <Text color="gray.500" fontSize="sm" maxW="400px">
            {message}
          </Text>
          {status && (
            <Code
              colorPalette="red"
              variant="subtle"
              fontSize="2xs"
              mt={2}
              px={2}
            >
              HTTP {status}
            </Code>
          )}
          <Box mt={4} w="full" textAlign="left">
            <Text
              fontSize="10px"
              color="gray.600"
              mb={1}
              fontWeight="bold"
              ml={1}
            >
              Error:
            </Text>
            <Code
              display="block"
              p={4}
              bg="blackAlpha.400"
              color="gray.300"
              fontSize="10px"
              borderRadius="md"
              whiteSpace="pre-wrap"
              overflowY="auto"
              maxH="200px"
              w="full"
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              {typeof error === "object"
                ? JSON.stringify(error, null, 2)
                : String(error)}
            </Code>
          </Box>
        </VStack>

        <Button
          onClick={onRetry}
          variant="outline"
          colorPalette="gray"
          size="sm"
          borderRadius="full"
          gap={2}
          _hover={{
            bg: "whiteAlpha.100",
            color: "blue.400",
          }}
          px={2}
        >
          <LuRefreshCcw size={14} />
          再試行する
        </Button>
      </VStack>
    </Center>
  );
};
