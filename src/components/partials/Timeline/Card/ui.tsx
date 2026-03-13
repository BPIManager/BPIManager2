import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Badge,
  Icon,
  IconButton,
  Grid,
  GridItem,
  Flex,
} from "@chakra-ui/react";
import { SmilePlus, Swords, TrendingUp, Crown, Minus } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { TimelineEntry } from "@/hooks/social/useTimeline";
import Link from "next/link";
import { diffColors } from "../../Table/table";

export const TimelineItem = ({ entry }: { entry: TimelineEntry }) => {
  const { opponentScore: opp, viewerScore: viewer, isOvertaken } = entry;

  const hasViewerScore = !!viewer;

  const vsEx = hasViewerScore ? viewer.exScore - opp.currentEx : 0;
  const vsBpi = hasViewerScore ? viewer.bpi - opp.currentBpi : 0;

  const isCurrentlyWinning = hasViewerScore && vsEx >= 0;
  const isCurrentlyLosing = hasViewerScore && vsEx < 0;

  return (
    <Box
      p={3}
      bg={
        isOvertaken
          ? "rgba(255, 0, 0, 0.08)"
          : isCurrentlyLosing
            ? "rgba(255, 0, 0, 0.03)"
            : isCurrentlyWinning
              ? "rgba(0, 255, 0, 0.02)"
              : "rgba(13, 17, 23, 0.6)"
      }
      borderBottom="1px solid"
      borderColor={
        isOvertaken || isCurrentlyLosing
          ? "red.900"
          : isCurrentlyWinning
            ? "green.900"
            : "whiteAlpha.100"
      }
      transition="all 0.2s"
    >
      <Grid templateColumns="auto 1fr" gap={3}>
        <GridItem>
          <Link href={`/rivals/${entry.userId}`}>
            <Avatar.Root size="sm">
              <Avatar.Fallback name={entry.userName} />
              <Avatar.Image src={entry.profileImage ?? ""} />
            </Avatar.Root>
          </Link>
        </GridItem>

        <GridItem minW={0}>
          <VStack align="stretch" gap={1.5}>
            <HStack justify="space-between" align="center">
              <HStack fontSize="xs" gap={2}>
                <Text fontWeight="bold" color="white" truncate>
                  <Link href={`/rivals/${entry.userId}`}>{entry.userName}</Link>
                </Text>

                {isCurrentlyLosing && (
                  <Badge
                    colorPalette="red"
                    variant="solid"
                    size="xs"
                    px={2}
                    borderRadius="full"
                  >
                    <Icon as={Swords} size="xs" mr={1} /> 敗北
                  </Badge>
                )}
                {isCurrentlyWinning && (
                  <Badge
                    colorPalette="green"
                    variant="solid"
                    size="xs"
                    px={2}
                    borderRadius="full"
                  >
                    <Icon as={Crown} size="xs" mr={1} /> 勝利
                  </Badge>
                )}
              </HStack>
              <Text fontSize="10px" color="whiteAlpha.400">
                {dayjs(entry.lastPlayed).fromNow()}
              </Text>
            </HStack>

            <VStack
              align="stretch"
              bg="blackAlpha.400"
              p={2}
              borderRadius="md"
              gap={2}
              borderWidth="1px"
              borderColor="whiteAlpha.50"
            >
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="bold" color="white" truncate>
                  {entry.title}
                </Text>
                <Badge
                  size="xs"
                  bg={diffColors[entry.difficulty]}
                  variant="subtle"
                  fontSize="9px"
                  px={2}
                >
                  {entry.difficulty}
                </Badge>
              </HStack>

              <ComparisonRow
                label="BPI"
                oppValue={opp.currentBpi}
                oppGrowth={opp.diffBpi}
                viewerValue={viewer?.bpi}
                diff={vsBpi}
                color="orange.300"
                isFloat
              />

              <ComparisonRow
                label="EX"
                oppValue={opp.currentEx}
                oppGrowth={opp.diffEx}
                viewerValue={viewer?.exScore}
                diff={vsEx}
                color="white"
              />
            </VStack>

            {/* <EmojiReactions /> */}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

const ComparisonRow = ({
  label,
  oppValue,
  oppGrowth,
  viewerValue,
  diff,
  color,
  isFloat = false,
}: any) => {
  const format = (v: number) => (isFloat ? v.toFixed(2) : v);
  const hasViewer = viewerValue !== undefined;

  return (
    <Grid
      templateColumns="28px 1.5fr 1fr 1fr 1.2fr"
      gap={1}
      alignItems="center"
      w="full"
    >
      <Text fontSize="9px" fontWeight="bold" color="gray.600">
        {label}
      </Text>

      <Text fontSize="xs" fontWeight="bold" color={color} textAlign="right">
        {format(oppValue)}
      </Text>

      <HStack justify="flex-end" gap={0} color="green.400">
        {oppGrowth && oppGrowth > 0 ? (
          <Text fontSize="9px" fontWeight="bold">
            +{format(oppGrowth)}
          </Text>
        ) : (
          <Text fontSize="9px" color="whiteAlpha.200">
            -
          </Text>
        )}
      </HStack>

      <Text
        fontSize="xs"
        fontWeight="bold"
        color={hasViewer ? "whiteAlpha.600" : "whiteAlpha.200"}
        textAlign="right"
      >
        {hasViewer ? format(viewerValue) : "---"}
      </Text>

      <Flex justify="flex-end">
        {hasViewer ? (
          <Badge
            variant="outline"
            colorPalette={diff >= 0 ? "green" : "red"}
            fontSize="12px"
            fontWeight="bold"
            px={1}
            h="14px"
            minW="38px"
            textAlign="center"
            lineHeight="14px"
            borderRadius="sm"
            display="inline-flex"
            justifyContent={"center"}
          >
            {diff >= 0 ? "+" : ""}
            {format(diff)}
          </Badge>
        ) : (
          <Box w="38px" />
        )}
      </Flex>
    </Grid>
  );
};
