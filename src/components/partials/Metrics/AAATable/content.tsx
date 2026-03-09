import { useState } from "react";
import {
  Box,
  Heading,
  Stack,
  SimpleGrid,
  Spinner,
  Center,
  Text,
} from "@chakra-ui/react";
import { GroupingMode, useAAATable } from "@/hooks/metrics/useAAATable";
import { latestVersion } from "@/constants/latestVersion";
import { AAATableFilter } from "@/components/partials/Metrics/AAATable/selector";
import { AAAGridItem } from "@/components/partials/Metrics/AAATable/table";

interface AAATableContentProps {
  userId: string | undefined;
  defaultVersion?: string;
}

export const AAATableContent = ({
  userId,
  defaultVersion = latestVersion,
}: AAATableContentProps) => {
  const [version, setVersion] = useState(defaultVersion);
  const [level, setLevel] = useState(12);
  const [goal, setGoal] = useState<"aaa" | "maxMinus">("aaa");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("target");

  const { groupedData, isLoading, isError } = useAAATable(
    userId,
    version,
    level,
    goal,
    groupingMode,
  );

  if (!userId)
    return (
      <Center py={10}>
        <Text>ユーザーIDが見つかりません</Text>
      </Center>
    );
  if (isError)
    return (
      <Center py={10}>
        <Text color="red.500">データの読み込みに失敗しました</Text>
      </Center>
    );

  return (
    <Stack gap={6} w="full">
      <AAATableFilter
        version={version}
        onVersionChange={setVersion}
        level={level}
        onLevelChange={setLevel}
        goal={goal}
        onGoalChange={setGoal}
        groupingMode={groupingMode}
        onGroupingModeChange={setGroupingMode}
      />

      {isLoading ? (
        <Center py={20}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : (
        <Stack gap={10}>
          {Object.keys(groupedData)
            .sort((a, b) => Number(b) - Number(a))
            .map((bpiKey) => (
              <Box key={bpiKey}>
                <Heading
                  size="xs"
                  mb={3}
                  color="gray.400"
                  borderBottomWidth="1px"
                  borderColor="whiteAlpha.100"
                  pb={1}
                >
                  BPI {bpiKey} ~ {Number(bpiKey) + 10}
                </Heading>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={2}>
                  {groupedData[Number(bpiKey)].map((item) => (
                    <AAAGridItem key={item.songId} item={item} goal={goal} />
                  ))}
                </SimpleGrid>
              </Box>
            ))}
        </Stack>
      )}
    </Stack>
  );
};
