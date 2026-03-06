import { createListCollection } from "@chakra-ui/react/collection";

/** List collection for Arena Ranks */
export const arenaRanks = [
  { label: "-", value: "-" },
  { label: "A1", value: "A1" },
  { label: "A2", value: "A2" },
  { label: "A3", value: "A3" },
  { label: "A4", value: "A4" },
  { label: "A5", value: "A5" },
  { label: "B1", value: "B1" },
  { label: "B2", value: "B2" },
  { label: "B3", value: "B3" },
  { label: "B4", value: "B4" },
  { label: "B5", value: "B5" },
];

export const arenaRanksCollection = createListCollection({
  items: arenaRanks,
});
