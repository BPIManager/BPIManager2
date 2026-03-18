import { useState } from "react";
import { AAATableItem } from "@/hooks/metrics/useAAATable";
import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/chakra/tooltip";
import { AAATableTooltip } from "./tooltip";

export const AAAGridItem = ({
  item,
  goal,
}: {
  item: AAATableItem;
  goal: "aaa" | "maxMinus";
}) => {
  const [open, setOpen] = useState(false);

  const target = item.targets[goal];
  const userBpi = item.user.bpi;
  const targetBpi = target.targetBpi;
  const bpiGap = userBpi - targetBpi;
  const isHighBpi = userBpi >= 100;

  const getBgColor = (gap: number, high: boolean) => {
    if (high) return "#003567";
    if (gap < -10) return "#FF3131";
    if (gap < -5) return "#FF8C8C";
    if (gap < -0.001) return "#FFE999";
    if (gap <= 5) return "#EAEFF9";
    if (gap <= 10) return "#6C9BD2";
    return "#187FC4";
  };

  const bgColor =
    item.user.exScore > 0 ? getBgColor(bpiGap, isHighBpi) : "gray.800";
  const useWhiteText = isHighBpi || bpiGap > 5 || item.user.exScore === 0;
  const diffChar = item.difficulty.slice(0, 1).toUpperCase();

  return (
    <Tooltip
      showArrow
      portalled
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      content={<AAATableTooltip item={item} />}
      contentProps={{
        css: {
          padding: "12px",
          bg: "gray.950",
          border: "1px solid",
          borderColor: "whiteAlpha.300",
          shadow: "2xl",
        },
      }}
    >
      <Box
        p={3}
        bg={bgColor}
        borderRadius="md"
        borderWidth="1px"
        borderColor={open ? "white" : "whiteAlpha.200"}
        transition="all 0.1s ease-out"
        _hover={{
          transform: "scale(1.04)",
          zIndex: 1,
          shadow: "xl",
          cursor: "help",
        }}
        color={useWhiteText ? "white" : "gray.900"}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{ touchAction: "manipulation", userSelect: "none" }}
      >
        <VStack align="stretch" gap={2}>
          <Text fontSize="xs" fontWeight="bold" truncate>
            {item.title} [{diffChar}]
          </Text>

          <HStack justify="space-between" align="flex-end">
            <VStack align="start" gap={0}>
              <Text
                fontSize="9px"
                opacity={0.7}
                fontWeight="bold"
                letterSpacing="tighter"
              >
                TARGET BPI
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {targetBpi.toFixed(2)}
              </Text>
            </VStack>

            <VStack align="end" gap={0}>
              <Text
                fontSize="9px"
                opacity={0.7}
                fontWeight="bold"
                letterSpacing="tighter"
              >
                MY BPI
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                {item.user.exScore > 0 ? userBpi.toFixed(2) : "-"}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </Tooltip>
  );
};
