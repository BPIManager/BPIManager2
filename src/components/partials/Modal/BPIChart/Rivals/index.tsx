"use client";

import { useState } from "react";
import { SongWithScore } from "@/types/songs/withScore";
import { RivalRankingBody } from "./ui";
import { latestVersion } from "@/constants/latestVersion";
import { versionsNonDisabledCollection } from "@/constants/versions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RivalsRanking({ song }: { song: SongWithScore }) {
  const [version, setVersion] = useState<string>(latestVersion);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-bpim-border bg-bpim-bg/40 p-4">
        <div className="flex flex-col gap-2 max-w-[240px]">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Version
          </label>
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger className="h-8 border-bpim-border bg-bpim-bg/20 text-xs text-slate-200 focus:ring-blue-500">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent className="border-bpim-border bg-bpim-bg">
              {versionsNonDisabledCollection.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <RivalRankingBody songId={song.songId} version={version} myScore={song} />
    </div>
  );
}
