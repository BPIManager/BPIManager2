import {
  Box,
  createListCollection,
  Portal,
  SelectContent,
  SelectItem,
  SelectItemGroup,
  SelectItemGroupLabel,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@chakra-ui/react";
import React from "react";

const GROUPS = [
  { id: "near", label: "実力が近いユーザーを探す" },
  { id: "rank", label: "ランキング" },
  { id: "active", label: "特殊検索" },
] as const;

export const SortSelector = ({
  sort,
  order,
  onChange,
}: {
  sort: string;
  order: string;
  onChange: (val: string) => void;
}) => {
  const sortCollection = createListCollection({
    items: [
      { label: "総合BPIが近い", value: "totalBpi_distance", group: "near" },
      { label: "NOTESが近い", value: "notes_distance", group: "near" },
      { label: "SCRATCHが近い", value: "scratch_distance", group: "near" },
      { label: "CHORDが近い", value: "chord_distance", group: "near" },
      { label: "PEAKが近い", value: "peak_distance", group: "near" },
      { label: "CHARGEが近い", value: "charge_distance", group: "near" },
      { label: "SOFLANが近い", value: "soflan_distance", group: "near" },
      { label: "総合BPIが高い順", value: "totalBpi_desc", group: "rank" },
      { label: "NOTESが高い順", value: "notes_desc", group: "rank" },
      { label: "SCRATCHが高い順", value: "scratch_desc", group: "rank" },
      { label: "CHORDが高い順", value: "chord_desc", group: "rank" },
      { label: "PEAKが高い順", value: "peak_desc", group: "rank" },
      { label: "CHARGEが高い順", value: "charge_desc", group: "rank" },
      { label: "SOFLANが高い順", value: "soflan_desc", group: "rank" },
      {
        label: "最近スコアを更新した人",
        value: "totalBpi_newest",
        group: "active",
      },
    ],
  });

  return (
    <SelectRoot
      collection={sortCollection}
      value={[`${sort}_${order}`]}
      onValueChange={(e) => onChange(e.value[0])}
      size="sm"
      variant="subtle"
      mb={4}
    >
      <SelectTrigger px={2}>
        <SelectValueText placeholder="並び替えを選択" />
      </SelectTrigger>
      <Portal>
        <SelectPositioner color="white">
          <SelectContent zIndex="popover" px={2}>
            {GROUPS.map((group, index) => {
              const items = sortCollection.items.filter(
                (i) => i.group === group.id,
              );
              if (items.length === 0) return null;

              return (
                <React.Fragment key={group.id}>
                  {index > 0 && <Box h="1px" bg="whiteAlpha.100" my={1} />}

                  <SelectItemGroup>
                    <SelectItemGroupLabel p={2} color="gray.500">
                      {group.label}
                    </SelectItemGroupLabel>
                    {items.map((item) => (
                      <SelectItem item={item} key={item.value} p={2}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectItemGroup>
                </React.Fragment>
              );
            })}
          </SelectContent>
        </SelectPositioner>
      </Portal>
    </SelectRoot>
  );
};
