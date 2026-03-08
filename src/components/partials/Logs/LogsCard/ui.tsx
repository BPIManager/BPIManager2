import {
  Card,
  HStack,
  VStack,
  Text,
  Badge,
  Box,
  Separator,
  SimpleGrid,
} from "@chakra-ui/react";
import { LuTrendingUp, LuListMusic, LuCalendar } from "react-icons/lu";
import dayjs from "dayjs";
import Link from "next/link";
import { UpdateLog } from "@/hooks/logs/useLogsList";
import { useUser } from "@/contexts/users/UserContext";

export const LogsCard = ({ log }: { log: UpdateLog }) => {
  const { user } = useUser();
  const isPositive = log.diff >= 0;

  return (
    <Link href={`/user/${user?.userId}/logs/${log.version}/${log.batchId}`}>
      <Card.Root
        mb={4}
        variant="elevated"
        bg="gray.950"
        borderColor="gray.800"
        transition="all 0.2s"
        _hover={{
          borderColor: "blue.500",
          bg: "gray.900",
          transform: "translateY(-2px)",
        }}
        cursor="pointer"
      >
        <Card.Body p={4}>
          <HStack justify="space-between" mb={3} align="start">
            <VStack align="start" gap={0}>
              <HStack color="gray.500" gap={1} mb={1}>
                <LuCalendar size={12} />
                <Text fontSize="xs">
                  {dayjs(log.createdAt).format("YYYY/MM/DD HH:mm")}
                </Text>
              </HStack>
              <HStack gap={2}>
                <Text fontSize="xl" fontWeight="bold" fontFamily="mono">
                  総合BPI {log.totalBpi.toFixed(2)}
                </Text>
                <Badge
                  variant="subtle"
                  colorPalette={isPositive ? "blue" : "red"}
                  fontSize="xs"
                  fontWeight="bold"
                  px={2}
                >
                  {isPositive ? "+" : ""}
                  {log.diff.toFixed(2)}
                </Badge>
              </HStack>
            </VStack>

            <HStack bg="gray.900" px={3} py={1} borderRadius="md" gap={2}>
              <LuListMusic size={14} color="gray" />
              <Text fontSize="sm" fontWeight="bold">
                {log.songCount}
              </Text>
              <Text fontSize="10px" color="gray.500">
                SONGS
              </Text>
            </HStack>
          </HStack>

          <Separator opacity={0.1} mb={3} />

          <VStack align="stretch" gap={1.5}>
            <Text
              fontSize="10px"
              fontWeight="bold"
              color="gray.600"
              letterSpacing="widest"
            >
              TOP UPDATES
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
              {log.topScores.map((score, i) => (
                <HStack
                  key={i}
                  justify="space-between"
                  bg="whiteAlpha.50"
                  p={2}
                  borderRadius="sm"
                >
                  <Text fontSize="xs" fontWeight="bold" lineClamp={1} flex={1}>
                    {score.title}
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="blue.400"
                    w="45px"
                    textAlign="right"
                  >
                    BPI
                    <br />
                    {score.bpi.toFixed(1)}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Link>
  );
};
