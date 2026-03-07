import { Box, Stack, VStack, HStack, Text } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { FormSelect } from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { GroupingMode } from "@/hooks/metrics/useAAATable";

interface Props {
  version: string;
  onVersionChange: (v: string) => void;
  level: number;
  onLevelChange: (l: number) => void;
  goal: "aaa" | "maxMinus";
  onGoalChange: (g: "aaa" | "maxMinus") => void;
  groupingMode: GroupingMode;
  onGroupingModeChange: (m: GroupingMode) => void;
}

export const AAATableFilter = ({
  version,
  onVersionChange,
  level,
  onLevelChange,
  goal,
  onGoalChange,
  groupingMode,
  onGroupingModeChange,
}: Props) => {
  const filterSections = [
    {
      label: "VERSION",
      minW: "160px",
      render: () => (
        <FormSelect
          collection={versionsNonDisabledCollection}
          value={version}
          onValueChange={(v) => onVersionChange(v as string)}
          size="xs"
          variant="subtle"
        />
      ),
    },
    {
      label: "LEVEL",
      render: () => (
        <RadioGroup
          value={level.toString()}
          onValueChange={(e) => onLevelChange(Number(e.value))}
        >
          <HStack gap={4}>
            <Radio value="11">☆11</Radio>
            <Radio value="12">☆12</Radio>
          </HStack>
        </RadioGroup>
      ),
    },
    {
      label: "TARGET GOAL",
      render: () => (
        <RadioGroup
          value={goal}
          onValueChange={(e) => onGoalChange(e.value as any)}
        >
          <HStack gap={4}>
            <Radio value="aaa">AAA</Radio>
            <Radio value="maxMinus">MAX-</Radio>
          </HStack>
        </RadioGroup>
      ),
    },
    {
      label: "並び替え基準",
      render: () => (
        <RadioGroup
          value={groupingMode}
          onValueChange={(e) => onGroupingModeChange(e.value as any)}
        >
          <HStack gap={4}>
            <Radio value="target">目標</Radio>
            <Radio value="self">マイスコア</Radio>
          </HStack>
        </RadioGroup>
      ),
    },
  ];

  return (
    <Box
      p={4}
      bg="gray.900"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        gap={{ base: 6, md: 10 }}
        align="start"
      >
        {filterSections.map((section) => (
          <VStack
            key={section.label}
            align="start"
            gap={1.5}
            minW={section.minW || "auto"}
          >
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.500"
              letterSpacing="wider"
            >
              {section.label}
            </Text>
            {section.render()}
          </VStack>
        ))}
      </Stack>
    </Box>
  );
};
