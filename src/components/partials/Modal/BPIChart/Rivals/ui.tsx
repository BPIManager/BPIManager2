import { useUser } from "@/contexts/users/UserContext";
import { useRivalScores } from "@/hooks/social/useRivalScores";
import { SongWithScore } from "@/types/songs/withScore";
import {
  Table,
  Badge,
  Avatar,
  HStack,
  Text,
  Box,
  Spinner,
  Stack,
  Center,
} from "@chakra-ui/react";
import { useMemo } from "react";

interface RivalRankingProps {
  version: string;
  songId: number;
  myScore?: SongWithScore;
}

export const RivalRankingBody = ({
  version,
  songId,
  myScore,
}: RivalRankingProps) => {
  const { fbUser } = useUser();
  const { data, isLoading } = useRivalScores(songId, version);

  const ranking = useMemo(() => {
    if (!data?.rivals) return myScore ? [myScore] : [];

    const combined = [...data.rivals];
    if (myScore && !combined.some((r) => r.userId === fbUser?.uid)) {
      combined.push({ ...myScore, isSelf: true });
    }

    return combined.sort((a, b) => b.exScore - a.exScore);
  }, [data, myScore, fbUser?.uid]);

  if (isLoading)
    return (
      <Center my={4}>
        <Spinner color="teal.500" />
      </Center>
    );

  return (
    <Box p={4}>
      <Table.Root size="sm" variant="line">
        <Table.Header bg="bg.muted">
          <Table.Row>
            <Table.ColumnHeader p={4} w="50px">
              Rank
            </Table.ColumnHeader>
            <Table.ColumnHeader p={4}>Player</Table.ColumnHeader>
            <Table.ColumnHeader p={4} textAlign="end">
              EX Score
            </Table.ColumnHeader>
            <Table.ColumnHeader p={4} textAlign="end">
              BPI
            </Table.ColumnHeader>
            <Table.ColumnHeader p={4} textAlign="end">
              Diff
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {ranking.map((row, index) => {
            const diff = myScore ? row.exScore - (myScore.exScore || 0) : 0;
            return (
              <Table.Row
                key={row.userId}
                bg={row.isSelf ? "blue.900" : "transparent"}
              >
                <Table.Cell p={2}>
                  <Text
                    fontWeight="bold"
                    color={index < 3 ? "yellow.500" : "fg.muted"}
                  >
                    #{index + 1}
                  </Text>
                </Table.Cell>
                <Table.Cell p={2}>
                  <HStack gap="3">
                    <Avatar.Root size="xs">
                      <Avatar.Image src={row.profileImage ?? ""} />
                      <Avatar.Fallback name={row.userName} />
                    </Avatar.Root>
                    <Stack gap="0">
                      <Text
                        fontWeight={row.isSelf ? "bold" : "medium"}
                        fontSize="sm"
                      >
                        {row.userName}
                        {row.isSelf && <>あなた</>}
                      </Text>
                    </Stack>
                  </HStack>
                </Table.Cell>
                <Table.Cell
                  p={2}
                  textAlign="end"
                  fontFamily="mono"
                  fontWeight="bold"
                >
                  {row.exScore}
                </Table.Cell>
                <Table.Cell
                  p={2}
                  textAlign="end"
                  fontFamily="mono"
                  fontSize="xs"
                >
                  {row.bpi.toFixed(2)}
                </Table.Cell>
                <Table.Cell
                  p={2}
                  textAlign="end"
                  fontFamily="mono"
                  fontSize="xs"
                  color={
                    diff > 0 ? "red.500" : diff < 0 ? "green.500" : "fg.muted"
                  }
                >
                  {diff > 0 ? `+${diff}` : diff === 0 ? "-" : diff}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
