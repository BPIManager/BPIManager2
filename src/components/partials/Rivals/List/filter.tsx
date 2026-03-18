import { Box, Stack, VStack, HStack, Text } from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/chakra/checkbox";
import { IIDX_LEVELS, IIDX_DIFFICULTIES } from "@/constants/diffs";

interface RivalFilterProps {
  levels: string[];
  difficulties: string[];
  onToggleLevel: (lv: string) => void;
  onToggleDifficulty: (diff: string) => void;
}

export const RivalFilter = ({
  levels,
  difficulties,
  onToggleLevel,
  onToggleDifficulty,
}: RivalFilterProps) => {
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
        <VStack align="start" gap={2} w="full">
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
            letterSpacing="wider"
          >
            LEVEL
          </Text>
          <HStack gap={4} wrap="wrap">
            {IIDX_LEVELS.map((l) => (
              <Checkbox
                key={l}
                size={{ base: "sm", md: "md" }}
                checked={levels.includes(l)}
                onCheckedChange={() => onToggleLevel(l)}
              >
                <Text fontSize={{ base: "xs", md: "sm" }} color="white">
                  ☆{l}
                </Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>

        <VStack align="start" gap={2} w="full">
          <Text
            fontSize={{ base: "2xs", md: "xs" }}
            fontWeight="bold"
            color="gray.500"
            letterSpacing="wider"
          >
            DIFFICULTY
          </Text>
          <HStack gap={4} wrap="wrap">
            {IIDX_DIFFICULTIES.map((d) => (
              <Checkbox
                key={d}
                size={{ base: "sm", md: "md" }}
                checked={difficulties.includes(d)}
                onCheckedChange={() => onToggleDifficulty(d)}
              >
                <Text fontSize={{ base: "xs", md: "sm" }} color="white">
                  {d}
                </Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>
      </Stack>
    </Box>
  );
};
