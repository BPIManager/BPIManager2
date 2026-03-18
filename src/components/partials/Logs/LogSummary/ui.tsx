import { useState } from "react";
import { SimpleGrid, Box, Text, Icon, VStack, Flex } from "@chakra-ui/react";
import { PlusCircle, HelpCircle, MusicIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/chakra/tooltip";
import { DashCard } from "@/components/ui/chakra/dashcard";

export const LabelWithTooltip = ({
  label,
  tooltipText,
  isSharing,
}: {
  label: string;
  tooltipText?: string;
  isSharing: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!tooltipText)
    return (
      <Text
        fontSize="sm"
        fontWeight="bold"
        color="gray.200"
        lineHeight="1.2"
        letterSpacing="tighter"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
    );

  return (
    <Flex align="center" gap={1}>
      <Text
        fontSize="sm"
        fontWeight="bold"
        color="gray.200"
        letterSpacing="tighter"
        whiteSpace="nowrap"
      >
        {label}
      </Text>
      {!isSharing && (
        <Tooltip content={tooltipText} open={isOpen} showArrow>
          <Box
            display="flex"
            alignItems="center"
            as="button"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            onClick={() => setIsOpen(!isOpen)}
            cursor="help"
          >
            <Icon as={HelpCircle} size={"sm"} color="gray.400" />
          </Box>
        </Tooltip>
      )}
    </Flex>
  );
};

export const BatchSummaryCards = ({
  summary,
  isSharing,
}: {
  summary: any;
  isSharing: boolean;
}) => {
  const stats = [
    {
      label: "今日のBPI",
      value: summary.batchPerformance,
      icon: PlusCircle,
      color: "blue.200",
      tooltip: "今回更新した☆12のみを対象とした総合BPI",
    },
    {
      label: "更新",
      value: summary.updatedScores,
      icon: PlusCircle,
      color: "orange.200",
    },
    {
      label: "新規",
      value: summary.newRecords,
      icon: MusicIcon,
      color: "purple.200",
    },
  ];

  return (
    <SimpleGrid columns={{ base: 3, md: 3 }} gap={2}>
      {stats.map((stat, i) => (
        <DashCard p={{ base: 3, md: 5 }} key={i}>
          <VStack align="start" gap={1}>
            <LabelWithTooltip
              isSharing={isSharing}
              label={stat.label}
              tooltipText={stat.tooltip}
            />
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={stat.color}
              fontFamily="mono"
            >
              {stat.value}
            </Text>
          </VStack>
        </DashCard>
      ))}
    </SimpleGrid>
  );
};
