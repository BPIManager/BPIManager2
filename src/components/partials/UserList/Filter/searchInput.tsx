import { Box, Center, Input } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { LuSearch } from "react-icons/lu";

export const SearchInput = ({
  initialValue,
  onSearch,
}: {
  initialValue: string;
  onSearch: (val: string) => void;
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) onSearch(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, initialValue, onSearch]);

  return (
    <Box position="relative" flex="1">
      <Center
        position="absolute"
        left={3}
        top="0"
        h="full"
        color="gray.500"
        zIndex={1}
      >
        <LuSearch />
      </Center>
      <Input
        placeholder="ユーザー名またはIIDX IDで検索"
        pl={10}
        bg="blackAlpha.400"
        border="none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Box>
  );
};
