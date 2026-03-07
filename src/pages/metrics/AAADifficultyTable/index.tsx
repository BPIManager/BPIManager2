import { useState } from "react";
import {
  Box,
  Heading,
  Stack,
  SimpleGrid,
  Text,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { GroupingMode, useAAATable } from "@/hooks/metrics/useAAATable";
import { AAATableFilter } from "@/components/partials/Metrics/AAATable/selector";
import { AAAGridItem } from "@/components/partials/Metrics/AAATable/table";
import { Meta } from "@/components/partials/Head";
import { PageHeader, PageContainer } from "@/components/partials/Header";
import { DashboardLayout } from "@/components/partials/Main";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "@/components/partials/LoginRequired/ui";

export const AAATableView = () => {
  const { isLoading: isUserLoading, fbUser } = useUser();

  const [version, setVersion] = useState("33");
  const [level, setLevel] = useState(12);
  const [goal, setGoal] = useState<"aaa" | "maxMinus">("aaa");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("target");

  const { groupedData, isLoading, isError } = useAAATable(
    fbUser?.uid,
    version,
    level,
    goal,
    groupingMode,
  );

  if (isUserLoading)
    return (
      <Center h="90vh">
        <Spinner />
      </Center>
    );

  if (isError) return <Text color="red.500">Error loading data.</Text>;

  return (
    <DashboardLayout>
      <PageHeader
        title="AAA達成難易度表"
        description={`BPIに基づくAAAまたはMAX-達成の難易度`}
      />
      <Meta
        title={`AAA達成難易度表`}
        description={`BPIに基づきIIDXの☆11,☆12についてAAAまたはMAX-を達成する難易度を表形式で確認できます。`}
      />

      <PageContainer>
        {!fbUser && <LoginRequiredCard />}
        {fbUser && (
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
                <Spinner size="xl" />
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
                        pb={1}
                      >
                        BPI {bpiKey} ~ {Number(bpiKey) + 10}
                      </Heading>
                      <SimpleGrid
                        columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
                        gap={2}
                      >
                        {groupedData[Number(bpiKey)].map((item) => (
                          <AAAGridItem
                            key={item.songId}
                            item={item}
                            goal={goal}
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))}
              </Stack>
            )}
          </Stack>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

export default AAATableView;
