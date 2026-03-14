import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Separator,
  Icon,
  Center,
} from "@chakra-ui/react";
import { LuTrophy, LuTrendingUp } from "react-icons/lu";
import { Switch } from "@/components/ui/switch";
import { RankItem } from "./item";
import { useLogRank } from "@/hooks/batches/useLogRank";
import { useState } from "react";
import { SongDetailView } from "../../Modal/BPIChart/SongDetails/ui";

const RANK_CONFIG = {
  growth: {
    title: "BPI伸び幅ランキング",
    icon: LuTrendingUp,
    accentColor: "green.400",
  },
  top: { title: "BPIランキング", icon: LuTrophy, accentColor: "yellow.400" },
};

export const LogRank = ({
  details,
  type,
  isSharing,
}: {
  details: any[];
  type: "growth" | "top";
  isSharing?: boolean;
}) => {
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const config = RANK_CONFIG[type];
  const {
    visibleSongs,
    hasMore,
    remainingCount,
    loadMore,
    hideNewRecords,
    setHideNewRecords,
    setDisplayLimit,
  } = useLogRank(details, type);

  const handleOpenDetail = (item: any) => {
    const mappedSong = {
      ...item,
      exScore: item.current.exScore,
      bpi: item.current.bpi,
      clearState: item.current.clearState,
      missCount: item.current.missCount,
    };
    setSelectedSong(mappedSong);
    setIsDetailOpen(true);
  };

  return (
    <VStack align="stretch" gap={4} w="full" mt={4}>
      <HStack justify="space-between">
        <HStack gap={2}>
          <Icon as={config.icon} color={config.accentColor} />
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="gray.200"
            letterSpacing="widest"
          >
            {config.title}
          </Text>
        </HStack>
        {type === "growth" && !isSharing && (
          <Switch
            colorPalette="blue"
            size="sm"
            checked={hideNewRecords}
            onCheckedChange={(e) => {
              setHideNewRecords(e.checked);
              setDisplayLimit(5);
            }}
          >
            <Text fontSize="2xs" fontWeight="bold" color="gray.400">
              新規除外
            </Text>
          </Switch>
        )}
      </HStack>

      <VStack
        align="stretch"
        gap={0}
        border="1px solid"
        borderColor="gray.800"
        borderRadius="xl"
        overflow="hidden"
        bg="gray.950"
      >
        {visibleSongs.length === 0 ? (
          <Center p={8} bg="whiteAlpha.50">
            <Text fontSize="xs" color="gray.500">
              データがありません
            </Text>
          </Center>
        ) : (
          visibleSongs.map((item, index) => (
            <Box key={item.songId}>
              <RankItem
                isSharing={isSharing}
                item={item}
                rank={index + 1}
                type={type}
                onClick={() => handleOpenDetail(item)}
              />
              {index !== visibleSongs.length - 1 && (
                <Separator borderColor="gray.900" />
              )}
            </Box>
          ))
        )}
      </VStack>

      {hasMore && (
        <Button variant="ghost" size="sm" color="gray.400" onClick={loadMore}>
          もっと表示（残り {remainingCount} 件）
        </Button>
      )}

      <SongDetailView
        song={selectedSong}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </VStack>
  );
};
