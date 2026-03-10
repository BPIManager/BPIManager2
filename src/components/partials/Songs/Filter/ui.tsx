import { useState, useEffect } from "react"; // 追加
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Separator,
  Flex,
  Spinner, // 追加
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
        <VStack align="start" gap={2}>
          <Text
            fontSize="10px"
            color="gray.500"
            fontWeight="bold"
            letterSpacing="widest"
          >
            LEVEL
          </Text>
          <HStack gap={4}>
            {[11, 12].map((lv) => (
              <Checkbox
                key={lv}
                checked={params.levels?.includes(lv)}
                onCheckedChange={() =>
                  onParamsChange({
                    levels: toggleArrayItem(params.levels, lv),
                  })
                }
              >
                <Text fontSize="xs" fontWeight="bold">
                  ☆{lv}
                </Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>

        <VStack align="start" gap={2}>
          <Text
            fontSize="10px"
            color="gray.500"
            fontWeight="bold"
            letterSpacing="widest"
          >
            DIFFICULTY
          </Text>
          <HStack gap={4}>
            {IIDX_DIFFICULTIES.map((diff) => (
              <Checkbox
                key={diff}
                checked={params.difficulties?.includes(diff)}
                onCheckedChange={() =>
                  onParamsChange({
                    difficulties: toggleArrayItem(params.difficulties, diff),
                  })
                }
              >
                <Text fontSize="xs" fontWeight="bold">
                  {diff[0]}
                </Text>
              </Checkbox>
            ))}
          </HStack>
        </VStack>
      </Flex>

      <Separator opacity={0.1} mt={3} />

      <HStack justify="space-between" align="center" mt={3}>
        <Text fontSize="12px" fontWeight="bold" color="blue.500">
          {totalCount.toLocaleString()} 曲見つかりました
        </Text>
        <HStack color="gray.400" gap={1}>
          <LuClock size={12} />
          <Text fontSize="12px">最終更新: </Text>
          <IconButton
            variant="ghost"
            size="xs"
            color={isSticky ? "blue.400" : "gray.500"}
            aria-label="Toggle Sticky"
            onClick={() => setIsSticky(!isSticky)}
            _hover={{ bg: "whiteAlpha.200" }}
          >
            {isSticky ? <LuPin size={14} /> : <LuPinOff size={14} />}
          </IconButton>
        </HStack>
      </HStack>
    </Box>
  );
};
