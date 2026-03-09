import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Stack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { SongWithScore } from "@/types/songs/withScore";
import { getDJRank } from "@/utils/songs/djRank";
import { RefObject } from "react";

export const diffColors: Record<string, string> = {
  ANOTHER: "red.800",
  LEGGENDARIA: "purple.800",
  HYPER: "yellow.800",
};

export const getLampColor = (clearState: string | null) => {
  switch (clearState) {
    case "NO PLAY":
      return "gray.400";
    case "ASSIST CLEAR":
      return "purple.500";
    case "EASY CLEAR":
      return "green.500";
    case "CLEAR":
      return "blue.500";
    case "HARD CLEAR":
      return "red.500";
    case "EX HARD CLEAR":
      return "yellow.500";
    case "FULLCOMBO CLEAR":
      return "rainbow";
    default:
      return "gray.400";
  }
};

interface SongItemProps {
  song: SongWithScore;
}

const SongItem = ({
  _song,
  onClick,
}: {
  _song: SongItemProps;
  onClick: () => void;
}) => {
  const { song } = _song;
  const lampColor = getLampColor(song.clearState);
  const isFullCombo = song.clearState === "FULLCOMBO CLEAR";
  return (
    <Box
      onClick={onClick}
      _hover={{ bg: "whiteAlpha.300" }}
      transition="background 0.2s"
      w="full"
      background="whiteAlpha.200"
      boxShadow="sm"
      boxShadowColor={"whiteAlpha.400"}
      position="relative"
      _before={{
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",

        background: isFullCombo
          ? "linear-gradient(to bottom, #ff0000, #8b00ff)"
          : lampColor,
        zIndex: 1,
      }}
      mb={2}
    >
      <Grid templateColumns="1fr auto" gap={1}>
        <GridItem
          overflow="hidden"
          px={3}
          py={2}
          display="flex"
          alignItems={"center"}
        >
          <VStack align="start" gap={0}>
            <HStack gap={2}>
              <Text fontWeight="bold" fontSize="sm" truncate>
                {song.title}
              </Text>
            </HStack>
            <Grid
              templateColumns="32px 12px 70px 70px"
              gap={2}
              alignItems="center"
            >
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

              {song.exScore && (
                <>
                  {(["current", "next"] as const).map((mode) => (
                    <Text
                      key={mode}
                      fontSize="10px"
                      lineHeight="1"
                      whiteSpace="nowrap"
                    >
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode,
                        output: "label",
                      })}
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode,
                        output: "value",
                      })}
                    </Text>
                  ))}
                </>
              )}
            </Grid>
          </VStack>
        </GridItem>
        <GridItem
          textAlign="right"
          display={"flex"}
          alignItems={"center"}
          background="blackAlpha.400"
          p={{ mdDown: 2, lg: 4 }}
        >
          <VStack align="end" gap={0}>
            <HStack>
              <VStack align="end" gap={0}>
                <Text fontSize="xs" color="gray.400" lineHeight="1">
                  EX
                </Text>
                <Text
                  fontSize={{ mdDown: "sm", lg: "xl" }}
                  fontWeight={"bold"}
                  color="gray.300"
                  lineHeight="1.1"
                >
                  {song.bpi !== null ? song.exScore : "---"}
                </Text>
                {song.exDiff && song.exDiff > 0 ? (
                  <Text fontSize="10px" color="green.400" fontWeight="bold">
                    +{song.exDiff}
                  </Text>
                ) : null}
              </VStack>
              <VStack ml={2} align="end" gap={0}>
                <Text fontSize="xs" color="gray.400" lineHeight="1">
                  BPI
                </Text>
                <Text
                  fontSize={{ mdDown: "sm", lg: "xl" }}
                  fontWeight={"bold"}
                  color="gray.300"
                  lineHeight="1.1"
                >
                  {song.bpi !== null ? song.bpi.toFixed(2) : "---"}
                </Text>
                {song.bpiDiff && song.bpiDiff > 0 ? (
                  <Text fontSize="10px" color="green.400" fontWeight="bold">
                    +{song.bpiDiff}
                  </Text>
                ) : null}
              </VStack>
            </HStack>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export const SongList = ({
  songs,
  onSongSelect,
  listRef,
}: {
  songs: SongWithScore[];
  onSongSelect: (s: SongWithScore) => void;
  listRef?: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <Box w="full" p={2} ref={listRef ? listRef : null}>
      {songs.map((song) => (
        <SongItem
          key={`${song.songId}-${song.difficulty}`}
          _song={{ song: song }}
          onClick={() => onSongSelect(song)}
        />
      ))}
    </Box>
  );
};
