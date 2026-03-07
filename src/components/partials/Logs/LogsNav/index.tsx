import { HStack, Button, Text, Box, Icon, VStack } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight, LuCalendar } from "react-icons/lu";
import { useRouter } from "next/router";

interface BatchRef {
  batchId: string;
  createdAt: string;
}

interface Props {
  userId: string | undefined;
  version: string | undefined;
  pagination: {
    prev: BatchRef | null;
    next: BatchRef | null;
    current: BatchRef;
  };
}
export const BatchNavigator = ({ userId, version, pagination }: Props) => {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const navigateTo = (batchId: string) => {
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, batchId },
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <HStack
      w="full"
      bg="gray.950"
      p={2}
      borderRadius="xl"
      border="1px solid"
      borderColor="whiteAlpha.100"
      mb={6}
      gap={0}
    >
      <Box flex="1" display="flex" justifyContent="flex-start">
        <Button
          variant="ghost"
          size="sm"
          px={2}
          disabled={!pagination.prev}
          onClick={() => pagination.prev && navigateTo(pagination.prev.batchId)}
          color="gray.400"
          _hover={{ color: "blue.400", bg: "whiteAlpha.50" }}
        >
          <LuChevronLeft />
          <VStack
            align="start"
            gap={0}
            ml={2}
            display={{ base: "none", md: "flex" }}
          >
            <Text fontSize="10px" color="gray.600">
              PREVIOUS
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {pagination.prev ? formatDate(pagination.prev.createdAt) : "---"}
            </Text>
          </VStack>
        </Button>
      </Box>

      <Box px={4} textAlign="center">
        <VStack gap={0}>
          <Text
            fontSize="2xs"
            fontWeight="black"
            color="gray.500"
            letterSpacing="widest"
          >
            更新日
          </Text>
          <Text
            fontSize="sm"
            fontWeight="black"
            color="white"
            fontFamily="mono"
            whiteSpace="nowrap"
          >
            {formatDate(pagination.current.createdAt)}
          </Text>
        </VStack>
      </Box>

      <Box flex="1" display="flex" justifyContent="flex-end">
        <Button
          variant="ghost"
          size="sm"
          px={2}
          disabled={!pagination.next}
          onClick={() => pagination.next && navigateTo(pagination.next.batchId)}
          color="gray.400"
          _hover={{ color: "blue.400", bg: "whiteAlpha.50" }}
        >
          <VStack
            align="end"
            gap={0}
            mr={2}
            display={{ base: "none", md: "flex" }}
          >
            <Text fontSize="10px" color="gray.600">
              NEXT
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {pagination.next ? formatDate(pagination.next.createdAt) : "---"}
            </Text>
          </VStack>
          <LuChevronRight />
        </Button>
      </Box>
    </HStack>
  );
};
