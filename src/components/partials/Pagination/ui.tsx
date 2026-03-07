import {
  ButtonGroup,
  Center,
  IconButton,
  Pagination as ChakraPagination,
} from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

interface CustomPaginationProps {
  count: number;
  pageSize: number;
  page: number;
  onPageChange: (page: number) => void;
  isSticky?: boolean;
}

export const CustomPagination = ({
  count,
  pageSize,
  page,
  onPageChange,
  isSticky = true,
}: CustomPaginationProps) => {
  if (count <= pageSize) return null;

  const content = (
    <ChakraPagination.Root
      count={count}
      pageSize={pageSize}
      page={page}
      onPageChange={(e) => onPageChange(e.page)}
    >
      <ButtonGroup variant="ghost" gap="1">
        <ChakraPagination.PrevTrigger asChild>
          <IconButton size="sm" aria-label="Previous Page">
            <LuChevronLeft />
          </IconButton>
        </ChakraPagination.PrevTrigger>

        <ChakraPagination.Items
          render={(pageItem) => (
            <IconButton
              key={pageItem.value}
              size="sm"
              variant={pageItem.value === page ? "outline" : "ghost"}
              onClick={
                pageItem.type === "page" ? undefined : (e) => e.preventDefault()
              }
            >
              {pageItem.value}
            </IconButton>
          )}
        />

        <ChakraPagination.NextTrigger asChild>
          <IconButton size="sm" aria-label="Next Page">
            <LuChevronRight />
          </IconButton>
        </ChakraPagination.NextTrigger>
      </ButtonGroup>
    </ChakraPagination.Root>
  );

  if (!isSticky) {
    return <Center py={4}>{content}</Center>;
  }

  return (
    <Center
      position="sticky"
      bottom={0}
      zIndex={20}
      w="full"
      h="70px"
      borderTopWidth="1px"
      borderColor="border"
      backdropFilter="blur(12px)"
      bg="bg/60"
      _dark={{
        bg: "black/60",
        borderColor: "whiteAlpha.200",
      }}
    >
      {content}
    </Center>
  );
};
