import { Box, Stack, VStack, HStack, Text } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { FormSelect } from "@/components/ui/select";
import { versionsNonDisabledCollection } from "@/constants/versions";

interface ArenaAverageFilterProps {
  version: string;
  onVersionChange: (value: string) => void;
  level: string;
  onLevelChange: (value: string) => void;
}

export const ArenaAverageFilter = ({
  version,
  onVersionChange,
  level,
  onLevelChange,
}: ArenaAverageFilterProps) => {
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
        <VStack align="start" gap={2} minW={{ base: "full", md: "240px" }}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="gray.500"
            letterSpacing="wider"
          >
            VERSION
          </Text>
          <FormSelect
            collection={versionsNonDisabledCollection}
            value={version}
            onValueChange={(e) => onVersionChange(e as string)}
            size="xs"
            variant="subtle"
          />
        </VStack>

        <VStack align="start" gap={2}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="gray.500"
            letterSpacing="wider"
          >
            LEVEL
          </Text>
          <RadioGroup
            value={level}
            onValueChange={(e) => onLevelChange(e.value as string)}
            colorPalette="blue"
          >
            <HStack gap={8} h="32px">
              <Radio value="11">
                <Text fontSize="sm" fontWeight="medium">
                  ☆11
                </Text>
              </Radio>
              <Radio value="12">
                <Text fontSize="sm" fontWeight="medium">
                  ☆12
                </Text>
              </Radio>
            </HStack>
          </RadioGroup>
        </VStack>
      </Stack>
    </Box>
  );
};
