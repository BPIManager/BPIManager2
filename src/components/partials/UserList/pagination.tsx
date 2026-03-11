import { Box, HStack, IconButton, Button, Text } from "@chakra-ui/react";
import { LuChevronsLeft, LuChevronLeft, LuChevronRight } from "react-icons/lu";

export const Pagination = ({
  p,
  hasMore,
  onPageChange,
}: {
  p: number;
  hasMore: boolean;
  onPageChange: (v: number) => void;
}) => (
  <HStack justify="center" gap={2} py={4}>
    {p !== 1 && (
      <IconButton
        aria-label="First"
        variant="ghost"
        onClick={() => onPageChange(1)}
      >
        <LuChevronsLeft />
      </IconButton>
    )}
    <Button
      variant="outline"
      size="sm"
      disabled={p <= 1}
      onClick={() => onPageChange(p - 1)}
      px={2}
    >
      <LuChevronLeft />
      前へ
    </Button>
    <Box px={4}>
      <Text fontSize="sm" fontWeight="bold" fontFamily="mono">
        PAGE {p}
      </Text>
    </Box>
    <Button
      variant="outline"
      size="sm"
      disabled={!hasMore}
      onClick={() => onPageChange(p + 1)}
      px={2}
    >
      次へ
      <LuChevronRight />
    </Button>
  </HStack>
);
