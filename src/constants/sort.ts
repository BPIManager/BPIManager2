import { createListCollection } from "@chakra-ui/react";

export const sortOptions = createListCollection({
  items: [
    { label: "BPIが高い順", value: "bpi" },
    { label: "レベル", value: "level" },
    { label: "楽曲名", value: "title" },
    { label: "最近更新", value: "updatedAt" },
  ],
});
