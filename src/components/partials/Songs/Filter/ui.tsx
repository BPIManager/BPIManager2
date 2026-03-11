import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Separator,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuClock,
  LuPin,
  LuPinOff,
} from "react-icons/lu";
import { InputGroup } from "@/components/ui/input-group";
import { FormSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { sortOptions } from "@/constants/sort";
import { FilterParamsFrontend } from "@/types/songs/withScore";
import { versionsNonDisabledCollection } from "@/constants/versions";
import { latestVersion } from "@/constants/latestVersion";
import { useRouter } from "next/router";
import { IIDX_DIFFICULTIES } from "@/constants/diffs";
import { FilterCheckboxGroup, FilterStickyToggle } from "./part";

interface SongFilterBarProps {
  params: FilterParamsFrontend;
  onParamsChange: (params: Partial<FilterParamsFrontend>) => void;
  onOpenAdvancedFilter: () => void;
  totalCount: number;
  disableVersionSelect?: boolean;
}

export const SongFilterBar = ({
  params,
  onParamsChange,
  onOpenAdvancedFilter,
  totalCount,
  disableVersionSelect,
}: SongFilterBarProps) => {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(true);

  const [localSearch, setLocalSearch] = useState(params.search || "");
  const isTyping = localSearch !== (params.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (params.search || "")) {
        onParamsChange({ search: localSearch });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onParamsChange, params.search]);

  useEffect(() => {
    setLocalSearch(params.search || "");
  }, [params.search]);

  const toggleArrayItem = <T,>(current: T[] | undefined, item: T) => {
    const list = current || [];
    return list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
  };
  const currentStoreVersion = router.query.version;
  return (
    <Box
      p={4}
      borderBottomWidth="1px"
      bg="gray.950"
      position={isSticky ? "sticky" : "relative"}
      top={0}
      zIndex={10}
    >
      <HStack w="full" gap={2} mb={2}>
        {!disableVersionSelect && (
          <FormSelect
            width="full"
            size="sm"
            collection={versionsNonDisabledCollection}
            value={String(currentStoreVersion ?? latestVersion)}
            onValueChange={(details) => {
              const newVersion = details;
              router.push({
                pathname: router.pathname,
                query: { ...router.query, version: newVersion },
              });
            }}
          />
        )}
        <FormSelect
          width="full"
          size="sm"
          collection={sortOptions}
          value={params.sortKey || "bpi"}
          onValueChange={(details) =>
            onParamsChange({
              sortKey: details as FilterParamsFrontend["sortKey"],
            })
          }
        />
      </HStack>

      <HStack w="full" gap={2}>
        <InputGroup
          flex={1}
          startElement={<LuSearch />}
          endElement={
            isTyping ? <Spinner size="xs" mr={2} color="blue.500" /> : null
          }
        >
          <Input
            placeholder="曲名で検索..."
            variant="subtle"
            size="sm"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </InputGroup>
        <IconButton variant="outline" size="sm" onClick={onOpenAdvancedFilter}>
          <LuSlidersHorizontal />
        </IconButton>
      </HStack>

      <Flex gap={6} wrap="wrap" mt={2}>
        <FilterCheckboxGroup
          label="LEVEL"
          items={[11, 12]}
          selected={params.levels}
          onToggle={(v: any) =>
            onParamsChange({ levels: toggleArrayItem(params.levels, v) })
          }
          getLabel={(v: any) => `☆${v}`}
        />
        <FilterCheckboxGroup
          label="DIFFICULTY"
          items={["HYPER", "ANOTHER", "LEGGENDARIA"]}
          selected={params.difficulties}
          onToggle={(v: any) =>
            onParamsChange({
              difficulties: toggleArrayItem(params.difficulties, v),
            })
          }
          getLabel={(v: any) => v[0]}
        />
      </Flex>

      <Separator opacity={0.1} mt={3} />
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="bold" color="blue.500">
          {totalCount.toLocaleString()}曲
        </Text>
        <FilterStickyToggle isSticky={isSticky} onToggle={setIsSticky} />
      </HStack>
    </Box>
  );
};
