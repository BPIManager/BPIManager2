import { AAATableItem } from "@/hooks/metrics/useAAATable";
import {
  Box,
  Text,
  VStack,
  HStack,
  Separator,
  Badge,
  Grid,
  GridItem,
} from "@chakra-ui/react";

interface Props {
  item: AAATableItem;
}

export const AAATableTooltip = ({ item }: Props) => {
  const diffChar = item.difficulty.slice(0, 1).toUpperCase();
  const maxScore = item.notes * 2;
  const scoreRate = ((item.user.exScore / maxScore) * 100).toFixed(2);

  const TargetSection = ({
    label,
    data,
    color,
  }: {
    label: string;
    data: { exScore: number; targetBpi: number; diff: number };
    color: string;
  }) => (
    <Box>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="10px" fontWeight="bold" color={color}>
          TARGET: {label}
        </Text>
        <Badge
          size="sm"
          variant="solid"
          px={1}
          colorPalette={data.diff >= 0 ? "blue" : "red"}
        >
          {data.diff >= 0 ? `+${data.diff}` : data.diff}
        </Badge>
      </HStack>
      <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="xs">
        <GridItem>
          <Text color="fg.muted" fontSize="9px">
            Score
          </Text>
          <Text fontWeight="medium">{data.exScore}</Text>
        </GridItem>
        <GridItem textAlign="right">
          <Text color="fg.muted" fontSize="9px">
            Target BPI
          </Text>
          <Text fontWeight="medium">{data.targetBpi.toFixed(2)}</Text>
        </GridItem>
      </Grid>
    </Box>
  );

  return (
    <VStack align="stretch" gap={3} p={1} minW="240px" color="white">
      <Box>
        <Text fontWeight="bold" fontSize="sm" lineHeight="tight">
          {item.title}[{diffChar}]
        </Text>
        <Badge
          size="xs"
          variant="outline"
          mt={1}
          color="white"
          borderColor="whiteAlpha.400"
        >
          Notes: {item.notes}
        </Badge>
      </Box>

      <Separator borderColor="whiteAlpha.300" />

      <Box>
        <Text fontSize="10px" fontWeight="bold" color="blue.300" mb={2}>
          YOUR STATUS
        </Text>
        <Grid templateColumns="repeat(3, 1fr)" gap={2} textAlign="center">
          <GridItem>
            <Text color="fg.muted" fontSize="9px">
              Score
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {item.user.exScore}
            </Text>
          </GridItem>
          <GridItem>
            <Text color="fg.muted" fontSize="9px">
              Rate
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              {scoreRate}%
            </Text>
          </GridItem>
          <GridItem>
            <Text color="fg.muted" fontSize="9px">
              BPI
            </Text>
            <Text fontSize="xs" fontWeight="bold" color="blue.200">
              {item.user.bpi.toFixed(2)}
            </Text>
          </GridItem>
        </Grid>
      </Box>

      <Separator borderColor="whiteAlpha.200" />

      <VStack gap={3} align="stretch">
        <TargetSection label="AAA" data={item.targets.aaa} color="yellow.400" />
        <TargetSection
          label="MAX-"
          data={item.targets.maxMinus}
          color="orange.400"
        />
      </VStack>
    </VStack>
  );
};
