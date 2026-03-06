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
import { clear } from "console";
import { getDJRank } from "@/utils/songs/djRank";

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

const SongItem = ({ song }: SongItemProps) => {
  const lampColor = getLampColor(song.clearState);
  const isFullCombo = song.clearState === "FULLCOMBO CLEAR";
  return (
    <Box
      w="full"
      background="whiteAlpha.200"
      boxShadow="sm"
      boxShadowColor={"whiteAlpha.400"}
      borderLeftWidth="4px"
      borderLeft="4px solid"
      borderLeftColor={isFullCombo ? "transparent" : lampColor}
      borderImageSource={
        isFullCombo ? "linear-gradient(to bottom, #ff0000,  #8b00ff)" : "none"
      }
      borderImageSlice={isFullCombo ? 1 : "none"}
      mb={2}
    >
      <Grid templateColumns="1fr auto" gap={1}>
        <GridItem overflow="hidden" px={3} py={2}>
          <VStack align="start" gap={0}>
            <HStack gap={2}>
              <Text fontWeight="bold" fontSize="sm" truncate>
                {song.title}
              </Text>
            </HStack>

            <HStack gap={3} mt={1} fontSize="10px" color="gray.200">
              <Badge
                size="sm"
                p={1}
                variant="solid"
                bg={diffColors[song.difficulty]}
                color="white"
                borderRadius="sm"
              >
                {song.difficultyLevel}
              </Badge>
              <Text fontSize="xs" color="gray.500" fontWeight="bold">
                {song.difficulty.charAt(0)}
              </Text>
              {song.exScore && (
                <>
                  {(["current", "next"] as const).map((item) => (
                    <Text px={1} fontSize="9px">
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode: item,
                        output: "label",
                      })}
                      {getDJRank(Number(song.exScore), song.notes * 2, {
                        mode: item,
                        output: "value",
                      })}
                    </Text>
                  ))}
                </>
              )}
            </HStack>
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
              </VStack>
            </HStack>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export const SongList = ({ songs }: { songs: SongWithScore[] }) => {
  return (
    <Box w="full" maxW="full" mx="auto" p={2} minH="100vh">
      <Stack gap={0}>
        {songs.map((song) => (
          <SongItem key={`${song.songId}-${song.difficulty}`} song={song} />
        ))}
      </Stack>
    </Box>
  );
};
