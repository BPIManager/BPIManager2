import { Box, Stack, VStack, HStack, Text } from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/diffs";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { FormSelect } from "@/components/ui/select";

export const DashBoardFilter = () => {
  const { levels, diffs, version, toggleLevel, toggleDiff, setVersion } =
    useStatsFilter();

  return (
    <Box
      p={4}
      bg="gray.900"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Stack
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 6, lg: 10 }}
        align="start"
      >
        <VStack align="start" gap={2} minW={{ base: "full", lg: "240px" }}>
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
          >
            VERSION
          </Text>
          <FormSelect
            collection={versionsNonDisabledCollection}
            value={version}
            onValueChange={setVersion}
            size="xs"
            variant="subtle"
          />
        </VStack>

        <VStack align="start" gap={2} w="full">
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
          >
            LEVEL
          </Text>
          <HStack gap={4} wrap="wrap">
            {IIDX_LEVELS.map((l) => (
              <Checkbox
                key={l}
                size={{ base: "sm", md: "md" }}
                checked={levels.includes(l)}
                onCheckedChange={() => toggleLevel(l)}
              >
                <Text fontSize={{ base: "xs", md: "sm" }}>☆{l}</Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>

        <VStack align="start" gap={2} w="full">
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
          >
            DIFFICULTY
          </Text>
          <HStack gap={4} wrap="wrap">
            {IIDX_DIFFICULTIES.map((d) => (
              <Checkbox
                key={d}
                size={{ base: "sm", md: "md" }}
                checked={diffs.includes(d)}
                onCheckedChange={() => toggleDiff(d)}
              >
                <Text fontSize={{ base: "xs", md: "sm" }}>{d}</Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>
      </Stack>
    </Box>
  );
};
