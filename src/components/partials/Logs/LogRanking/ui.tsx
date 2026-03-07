import { useState, useMemo } from "react";
import {
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Box,
  Separator,
  Icon,
  Center,
} from "@chakra-ui/react";
import { LuTrophy, LuChevronDown, LuTrendingUp } from "react-icons/lu";
import { Switch } from "@/components/ui/switch";

interface Props {
  details: any[];
  type: "growth" | "top";
}

export const LogRank = ({ details, type }: Props) => {
  const [displayLimit, setDisplayLimit] = useState(5);
  const [hideNewRecords, setHideNewRecords] = useState(false);

  // 設定の切り替え
  const config = {
    growth: {
      title: "BPI伸び幅ランキング",
      icon: LuTrendingUp,
      accentColor: "green.400",
    },
    top: {
      title: "BPIランキング",
      icon: LuTrophy,
      accentColor: "yellow.400",
    },
  }[type];

  // バッジの色とラベルのロジック
  const getBadgeData = (item: any) => {
    if (type === "growth") {
      const diff = item.diff.bpi;
      let color = "cyan";
      if (diff >= 10) color = "red";
      else if (diff >= 5) color = "orange";
      else if (diff >= 3) color = "yellow";
      else if (diff >= 1) color = "green";
      return { color, label: `+${diff.toFixed(2)}` };
    } else {
      const val = item.current.bpi;
      let color = "gray";
      if (val >= 100) color = "pink";
      else if (val >= 70) color = "yellow";
      else if (val >= 40) color = "green";
      else if (val >= 0) color = "blue";
      return { color, label: val.toFixed(2) };
    }
  };

  // ソート & フィルタ
  const sortedSongs = useMemo(() => {
    return [...details]
      .filter((d) => {
        if (type === "growth") return d.diff && d.diff.bpi > 0;
        return d.current && d.current.bpi !== null;
      })
      .filter((d) => (hideNewRecords ? !!d.previous : true))
      .sort((a, b) => {
        if (type === "growth") return b.diff.bpi - a.diff.bpi;
        return b.current.bpi - a.current.bpi;
      });
  }, [details, hideNewRecords, type]);

  const visibleSongs = sortedSongs.slice(0, displayLimit);
  const hasMore = sortedSongs.length > displayLimit;

  return (
    <VStack align="stretch" gap={4} w="full" mt={4}>
      <HStack justify="space-between" align="center">
        <HStack gap={2}>
          <Icon as={config.icon} color={config.accentColor} />
          <Text
            fontSize="sm"
            fontWeight="black"
            color="gray.200"
            letterSpacing="widest"
          >
            {config.title}
          </Text>
        </HStack>
        {type === "growth" && (
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
          visibleSongs.map((item, index) => {
            const rank = index + 1;
            const badge = getBadgeData(item);
            return (
              <Box key={item.songId}>
                <HStack
                  p={4}
                  bg={rank <= 3 ? "whiteAlpha.50" : "transparent"}
                  justify="space-between"
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  <HStack gap={4} flex={1}>
                    <Center w="24px">
                      <Text
                        fontSize="lg"
                        fontWeight="black"
                        fontFamily="mono"
                        color={
                          rank === 1
                            ? "yellow.400"
                            : rank === 2
                              ? "gray.300"
                              : rank === 3
                                ? "orange.400"
                                : "gray.600"
                        }
                      >
                        {rank}
                      </Text>
                    </Center>
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
                        {item.title}
                      </Text>
                      <HStack gap={2}>
                        <Badge size="xs" variant="subtle">
                          {item.difficulty}
                        </Badge>
                        <Text fontSize="2xs" color="gray.500">
                          LV{item.level}
                        </Text>
                        {!item.previous && (
                          <Badge
                            size="xs"
                            colorPalette="purple"
                            variant="outline"
                            fontSize="8px"
                            px={2}
                          >
                            新規
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>

                  <HStack gap={4}>
                    <VStack align="end" gap={0}>
                      <Text fontSize="xs" color="gray.500">
                        EX
                      </Text>
                      <Text fontSize="md" fontWeight="black" fontFamily="mono">
                        {item.current.exScore}
                      </Text>
                    </VStack>
                    <Badge
                      size="lg"
                      colorPalette={badge.color}
                      variant="solid"
                      borderRadius="md"
                      px={2}
                      textAlign="center"
                    >
                      {badge.label}
                    </Badge>
                  </HStack>
                </HStack>
                {index !== visibleSongs.length - 1 && (
                  <Separator borderColor="gray.900" />
                )}
              </Box>
            );
          })
        )}
      </VStack>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          color="gray.400"
          onClick={() => setDisplayLimit((prev) => prev + 10)}
        >
          もっと表示（残り {sortedSongs.length - displayLimit} 件）
        </Button>
      )}
    </VStack>
  );
};
