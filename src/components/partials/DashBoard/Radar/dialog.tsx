import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VStack, HStack, Text, Box, Badge, Tabs } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { RadarSongEntry } from "@/types/stats/radar";
import { getBpiColorStyle } from "../BPIDistribution";
import { LuArrowDownWideNarrow, LuArrowUpNarrowWide } from "react-icons/lu";

export const RadarCategorySongsDialog = ({
  categoryName,
  songs,
  isOpen,
  onClose,
}: {
  categoryName: string;
  songs: RadarSongEntry[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      return sortOrder === "desc" ? b.bpi - a.bpi : a.bpi - b.bpi;
    });
  }, [songs, sortOrder]);

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={onClose}
      size="md"
      scrollBehavior="inside"
      placement={"center"}
    >
      <DialogContent
        bg="gray.950"
        border="1px solid"
        borderColor="whiteAlpha.200"
        maxHeight={"80svh"}
      >
        <DialogHeader
          p={4}
          borderBottomWidth="1px"
          borderColor="whiteAlpha.100"
        >
          <DialogTitle fontSize="md" color="white">
            {categoryName} - 楽曲リスト ({songs.length})
          </DialogTitle>
          <DialogCloseTrigger color="white" />
        </DialogHeader>

        <DialogBody py={4}>
          <Tabs.Root
            value={sortOrder}
            onValueChange={(e) => setSortOrder(e.value)}
            variant="subtle"
            colorPalette="blue"
          >
            <Tabs.List
              bg="whiteAlpha.50"
              p={1}
              rounded="md"
              mb={4}
              width="full"
            >
              <Tabs.Trigger
                value="desc"
                flex="1"
                gap={2}
                fontSize="xs"
                justifyContent={"center"}
              >
                <LuArrowDownWideNarrow size={14} /> BPIが高い順
              </Tabs.Trigger>
              <Tabs.Trigger
                value="asc"
                flex="1"
                gap={2}
                fontSize="xs"
                justifyContent={"center"}
              >
                <LuArrowUpNarrowWide size={14} /> BPIが低い順
              </Tabs.Trigger>
            </Tabs.List>

            <VStack align="stretch" gap={2}>
              {sortedSongs.map((song, i) => {
                const style = getBpiColorStyle(song.bpi);
                return (
                  <Box
                    key={`${song.title}-${song.difficulty}`}
                    p={3}
                    bg="whiteAlpha.50"
                    rounded="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.100"
                  >
                    <HStack justify="space-between" align="center">
                      <VStack align="start" gap={0} flex="1">
                        <Text
                          fontSize="xs"
                          fontWeight="bold"
                          color="white"
                          lineClamp={1}
                        >
                          {song.title}
                        </Text>
                        <Text fontSize="10px" color="gray.500">
                          {song.difficulty}
                        </Text>
                      </VStack>
                      <HStack gap={3}>
                        <VStack align="end" gap={0}>
                          <Text fontSize="10px" color="gray.500">
                            EX SCORE
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            color="gray.200"
                            fontFamily="mono"
                          >
                            {song.exScore}
                          </Text>
                        </VStack>
                        <Badge
                          variant="outline"
                          borderColor={style.bg}
                          color={style.color}
                          fontFamily="mono"
                          fontSize="xs"
                          display="inline-flex"
                          alignItems="center"
                          justifyContent="center"
                          minW="80px"
                          textAlign="center"
                          rounded="sm"
                        >
                          {song.bpi.toFixed(2)}
                        </Badge>
                      </HStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Tabs.Root>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
};
