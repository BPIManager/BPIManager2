import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { Search, Pin, PinOff } from "lucide-react";
import { InputGroup } from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";

export const FilterSearchInput = ({
  value,
  onChange,
  placeholder = "曲名で検索...",
}: any) => {
  const [local, setLocal] = useState(value || "");
  const isTyping = local !== (value || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 500);
    return () => clearTimeout(timer);
  }, [local, onChange, value]);

  return (
    <InputGroup
      flex={1}
      startElement={<Search size={14} />}
      endElement={isTyping ? <Spinner size="xs" color="blue.500" /> : null}
      width="full"
    >
      <Input
        placeholder={placeholder}
        variant="subtle"
        size="sm"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </InputGroup>
  );
};

interface FilterCheckboxGroupProps<T> {
  label: string;
  items: T[];
  selected: T[] | undefined;
  onToggle: (item: T) => void;
  getLabel?: (item: T) => string | number;
}

export const FilterCheckboxGroup = <T extends string | number>({
  label,
  items,
  selected,
  onToggle,
  getLabel,
}: FilterCheckboxGroupProps<T>) => (
  <VStack align="start" gap={1.5}>
    <Text
      fontSize="10px"
      color="gray.500"
      fontWeight="bold"
      letterSpacing="widest"
    >
      {label}
    </Text>
    <HStack gap={4}>
      {items.map((item: any) => (
        <Checkbox
          key={String(item)}
          checked={selected?.includes(item)}
          onCheckedChange={() => onToggle(item)}
          size="sm"
        >
          <Text fontSize="xs" fontWeight="bold">
            {getLabel ? getLabel(item) : item}
          </Text>
        </Checkbox>
      ))}
    </HStack>
  </VStack>
);

export const FilterStickyToggle = ({ isSticky, onToggle }: any) => (
  <IconButton
    variant="ghost"
    size="xs"
    color={isSticky ? "blue.400" : "gray.500"}
    onClick={() => onToggle(!isSticky)}
  >
    {isSticky ? <Pin size={14} /> : <PinOff size={14} />}
  </IconButton>
);
