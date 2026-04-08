import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { SortKey, SortDir } from "@/types/songs/songList";

interface SortIconProps {
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
}

export function SortIcon({ sortKey, currentKey, dir }: SortIconProps) {
  if (sortKey !== currentKey)
    return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 text-bpim-primary" />
  ) : (
    <ChevronDown className="h-3 w-3 text-bpim-primary" />
  );
}
