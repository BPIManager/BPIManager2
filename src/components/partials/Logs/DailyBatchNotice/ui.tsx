import {
  Box,
  HStack,
  Text,
  Button,
  Badge,
  Circle,
  Stack,
  Flex,
} from "@chakra-ui/react";
import { Info, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/contexts/users/UserContext";
import dayjs from "@/lib/dayjs";
import { useRouter } from "next/router";

interface DailyBatchNoticeProps {
  dailyBatchIds: string[];
  currentBatchId: string;
  createdAt: string;
  version: string;
}

export const DailyBatchNotice = ({
  dailyBatchIds,
  currentBatchId,
  createdAt,
  version,
}: DailyBatchNoticeProps) => {
  if (dailyBatchIds.length <= 1) return null;
  const { user } = useUser();
  const router = useRouter();
  const { userId } = router.query;

  const dateStr = dayjs(createdAt).tz().format("YYYY-MM-DD");
  const currentIndex = dailyBatchIds.indexOf(currentBatchId) + 1;

  return (
    <Box
      bg="blue.950/30"
      borderWidth="1px"
      borderColor="blue.800/50"
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      mb={6}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        right="-20px"
        top="-20px"
        color="blue.500/10"
        pointerEvents="none"
      >
        <LayoutGrid size={120} />
      </Box>

      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 4, md: 8 }}
      >
        <Flex gap={4} align="center" flex="1">
          <Circle
            size={{ base: "40px", md: "48px" }}
            bg="blue.900/60"
            color="blue.300"
            flexShrink={0}
            borderWidth="1px"
            borderColor="blue.700/50"
          >
            <Info size={22} />
          </Circle>

          <Box flex="1">
            <HStack gap={3} mb={1} wrap="wrap">
              <Text
                fontWeight="bold"
                fontSize={{ base: "md", md: "lg" }}
                letterSpacing="tight"
              >
                {dateStr}
              </Text>
              <Badge
                variant="solid"
                bg="blue.800"
                color="blue.100"
                size="md"
                borderRadius="full"
                px={3}
              >
                {currentIndex} / {dailyBatchIds.length} 回目の更新
              </Badge>
            </HStack>
            <Text
              fontSize={{ base: "xs", md: "sm" }}
              color="fg.muted"
              whiteSpace={{ md: "nowrap" }}
            >
              合計{dailyBatchIds.length}回のスコア更新が記録されています。
            </Text>
          </Box>
        </Flex>

        <Link
          href={`/user/${userId as string}/logs/${version}/summary/${dateStr}`}
          passHref
        >
          <Button
            size={{ base: "md", md: "lg" }}
            colorPalette="blue"
            variant="solid"
            gap={2}
            px={6}
            w={{ base: "full", md: "auto" }}
            shadow="md"
            _hover={{ transform: "translateY(-1px)", shadow: "lg" }}
            transition="all 0.2s"
          >
            <LayoutGrid size={18} />
            一日のまとめを見る
          </Button>
        </Link>
      </Stack>
    </Box>
  );
};
