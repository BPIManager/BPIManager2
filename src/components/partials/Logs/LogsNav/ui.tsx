import { HStack, Button, Text, Box, VStack } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/router";
import dayjs from "@/lib/dayjs";

interface BatchRef {
  batchId: string;
  createdAt: string;
}

interface LogNavigatorProps {
  type: "batch" | "daily" | "weekly" | "monthly";
  userId: string | undefined;
  version: string | undefined;
  date?: string;
  pagination: {
    prev: BatchRef | null;
    next: BatchRef | null;
    current: BatchRef;
    prevDate?: string | null;
    nextDate?: string | null;
  };
}

export const LogNavigator = ({
  type,
  userId,
  version,
  date,
  pagination,
}: LogNavigatorProps) => {
  const router = useRouter();

  const formatDateLabel = (dateString: string) => {
    if (type === "daily") {
      return dayjs(dateString).tz().format("M月D日");
    }
    return dayjs(dateString).tz().format("M/D HH:mm");
  };

  const navigateTo = (target: string) => {
    if (type === "batch") {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, batchId: target },
        },
        undefined,
        { shallow: true },
      );
    } else {
      router.push(`/users/${userId}/logs/${version}/summary/${target}`);
    }
  };

  const hasPrev = type === "batch" ? !!pagination.prev : !!pagination.prevDate;
  const hasNext = type === "batch" ? !!pagination.next : !!pagination.nextDate;

  const prevVal =
    type === "batch" ? pagination.prev?.batchId : pagination.prevDate;
  const nextVal =
    type === "batch" ? pagination.next?.batchId : pagination.nextDate;

  const prevLabel =
    type === "batch"
      ? pagination.prev
        ? formatDateLabel(pagination.prev.createdAt)
        : "---"
      : pagination.prevDate
        ? formatDateLabel(pagination.prevDate)
        : "---";

  const nextLabel =
    type === "batch"
      ? pagination.next
        ? formatDateLabel(pagination.next.createdAt)
        : "---"
      : pagination.nextDate
        ? formatDateLabel(pagination.nextDate)
        : "---";

  const currentLabel =
    type === "batch"
      ? dayjs(pagination.current.createdAt).tz().format("M月D日 HH:mm")
      : dayjs(date).tz().format("YYYY/MM/DD");

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
          disabled={!hasPrev}
          onClick={() => prevVal && navigateTo(prevVal)}
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
            <Text fontSize="10px" color="gray.600" letterSpacing="tighter">
              {type === "batch" ? "PREVIOUS BATCH" : "PREVIOUS DAY"}
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {prevLabel}
            </Text>
          </VStack>
        </Button>
      </Box>

      <Box px={4} textAlign="center">
        <VStack gap={0}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="gray.500"
            letterSpacing="widest"
          >
            {type === "batch" ? "更新日時" : "対象日"}
          </Text>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="white"
            fontFamily="mono"
            whiteSpace="nowrap"
          >
            {currentLabel}
          </Text>
        </VStack>
      </Box>

      <Box flex="1" display="flex" justifyContent="flex-end">
        <Button
          variant="ghost"
          size="sm"
          px={2}
          disabled={!hasNext}
          onClick={() => nextVal && navigateTo(nextVal)}
          color="gray.400"
          _hover={{ color: "blue.400", bg: "whiteAlpha.50" }}
        >
          <VStack
            align="end"
            gap={0}
            mr={2}
            display={{ base: "none", md: "flex" }}
          >
            <Text fontSize="10px" color="gray.600" letterSpacing="tighter">
              {type === "batch" ? "NEXT BATCH" : "NEXT DAY"}
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {nextLabel}
            </Text>
          </VStack>
          <LuChevronRight />
        </Button>
      </Box>
    </HStack>
  );
};
