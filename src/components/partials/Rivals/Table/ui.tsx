import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Grid,
  GridItem,
  Flex,
} from "@chakra-ui/react";
import { SongWithRival } from "@/hooks/social/useRivalAllScores";
import { getLampColor } from "@/components/partials/Table/table";

const f = (val: number | null | undefined, p?: number) => {
  if (val === null || val === undefined || !Number.isFinite(val)) return "---";
  return p !== undefined ? val.toFixed(p) : val.toString();
};

export const RivalSongItem = ({
  song,
  onClick,
}: {
  song: SongWithRival;
  onClick: () => void;
}) => {
  const { exDiff, bpiDiff } = song;

  return (
    <Box
      onClick={onClick}
      _hover={{ bg: "whiteAlpha.100" }}
      transition="all 0.15s"
      w="full"
      bg="rgba(255, 255, 255, 0.02)"
      borderBottom="1px solid"
      borderColor="whiteAlpha.50"
      cursor="pointer"
      position="relative"
    >
      <Grid
        display={{ base: "none", lg: "grid" }}
        templateColumns="1fr 140px 100px 140px"
        alignItems="stretch"
        h="68px"
      >
        <GridItem px={4} display="flex" alignItems="center" minW={0}>
          <SongInfo song={song} />
        </GridItem>

        <ScoreBox
          label="YOU"
          ex={song.exScore}
          bpi={song.bpi}
          clearState={song.clearState}
          color="blue.300"
        />

        <DiffBox exDiff={exDiff} bpiDiff={bpiDiff} />

        <ScoreBox
          label="RIVAL"
          ex={song.rival?.exScore}
          bpi={song.rival?.bpi}
          clearState={song.rival?.clearState}
          color="orange.300"
          isRival
        />
      </Grid>

      <VStack
        display={{ base: "flex", lg: "none" }}
        gap={0}
        align="stretch"
        py={4}
        px={3}
      >
        <Box mb={3}>
          <SongInfo song={song} />
        </Box>

        <Grid templateColumns="1fr 80px 1fr" gap={2} alignItems="center">
          <MobileScoreView
            label="YOU"
            ex={song.exScore}
            bpi={song.bpi}
            clearState={song.clearState}
            align="start"
          />
          <DiffBox exDiff={exDiff} bpiDiff={bpiDiff} isMobile />
          <MobileScoreView
            label="RIVAL"
            ex={song.rival?.exScore}
            bpi={song.rival?.bpi}
            clearState={song.rival?.clearState}
            align="end"
          />
        </Grid>
      </VStack>
    </Box>
  );
};

const SongInfo = ({ song }: { song: SongWithRival }) => {
  const diffColors: Record<string, string> = {
    ANOTHER: "red.800",
    LEGGENDARIA: "purple.800",
    HYPER: "yellow.800",
  };
  return (
    <VStack align="start" gap={1} minW={0} w="full">
      <Text fontWeight="bold" fontSize="sm" color="white">
        {song.title}
      </Text>
      <HStack gap={2}>
        <Badge
          w="32px"
          h="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={0}
          variant="solid"
          bg={diffColors[song.difficulty]}
          color="white"
          borderRadius="sm"
        >
          <Text fontSize="11px" fontWeight="bold" lineHeight="1">
            {song.difficultyLevel}
          </Text>
        </Badge>

        <Text
          fontSize="xs"
          color="gray.500"
          fontWeight="bold"
          textAlign="center"
          lineHeight="1"
        >
          {song.difficulty.charAt(0)}
        </Text>
      </HStack>
    </VStack>
  );
};

const ScoreBox = ({ label, ex, bpi, clearState, color, isRival }: any) => {
  const lamp = getLampColor(clearState);
  return (
    <Flex
      direction="column"
      justify="center"
      align={isRival ? "start" : "end"}
      px={5}
      bg={isRival ? "blackAlpha.400" : "transparent"}
      position="relative"
      _before={{
        content: '""',
        position: "absolute",
        left: isRival ? 0 : "auto",
        right: isRival ? "auto" : 0,
        top: 0,
        bottom: 0,
        width: "3px",
        background:
          lamp === "rainbow"
            ? "linear-gradient(to bottom, #ff0000, #8b00ff)"
            : lamp,
      }}
    >
      <Text fontSize="9px" color={color} fontWeight="black" mb={1}>
        {label}
      </Text>
      <HStack gap={4} align="baseline">
        <VStack align={isRival ? "start" : "end"} gap={0}>
          <Text fontSize="8px" color="whiteAlpha.400">
            EX
          </Text>
          <Text fontSize="md" fontWeight="bold" color="white" lineHeight="1">
            {f(ex)}
          </Text>
        </VStack>
        <VStack align={isRival ? "start" : "end"} gap={0}>
          <Text fontSize="8px" color="whiteAlpha.400">
            BPI
          </Text>
          <Text fontSize="md" fontWeight="bold" color="white" lineHeight="1">
            {f(bpi, 2)}
          </Text>
        </VStack>
      </HStack>
    </Flex>
  );
};

const DiffBox = ({ exDiff, bpiDiff, isMobile }: any) => {
  const hasDiff = exDiff !== null && Number.isFinite(exDiff);
  return (
    <VStack justify="center" gap={0} opacity={hasDiff ? 1 : 0.1}>
      <Text fontSize="8px" color="gray.600" fontWeight="black">
        DIFF
      </Text>
      <Text
        fontSize={isMobile ? "11px" : "12px"}
        fontWeight="black"
        color={exDiff > 0 ? "green.400" : exDiff < 0 ? "red.400" : "gray.500"}
        lineHeight="1.1"
      >
        {exDiff > 0 ? `+${exDiff}` : (exDiff ?? "---")}
      </Text>
      <Text
        fontSize="10px"
        fontWeight="bold"
        color={bpiDiff > 0 ? "green.300" : bpiDiff < 0 ? "red.300" : "gray.600"}
        lineHeight="1"
      >
        {bpiDiff > 0
          ? `+${bpiDiff.toFixed(2)}`
          : (bpiDiff?.toFixed(2) ?? "---")}
      </Text>
    </VStack>
  );
};

const MobileScoreView = ({ label, ex, bpi, clearState, align }: any) => {
  const lamp = getLampColor(clearState);
  return (
    <VStack align={align} gap={1} flex={1} minW={0} position="relative">
      <HStack gap={2}>
        <Box
          w="3px"
          h="10px"
          bg={lamp === "rainbow" ? "linear-gradient(#f00, #80f)" : lamp}
        />
        <Text
          fontSize="10px"
          color={label === "YOU" ? "blue.300" : "orange.300"}
          fontWeight="black"
        >
          {label}
        </Text>
      </HStack>
      <VStack align={align} gap={0}>
        <Text fontSize="sm" fontWeight="bold" color="white" lineHeight="1">
          {f(ex)}
        </Text>
        <Text fontSize="10px" color="whiteAlpha.500" fontFamily="mono">
          {f(bpi, 1)}
        </Text>
      </VStack>
    </VStack>
  );
};
