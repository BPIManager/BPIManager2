"use client";

import { Activity, LucideIcon, Swords, UserCheck } from "lucide-react";
import { SectionLoader } from "@/components/ui/loading-spinner";
import { TimelineList } from "./ui";
import { FilterCheckboxGroup, FilterSearchInput } from "../Songs/Filter/part";
import { useUser } from "@/contexts/users/UserContext";
import { LoginRequiredCard } from "../LoginRequired/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimelineFilter } from "@/hooks/social/useTimelineFilter";

export const TimelineContainer = () => {
  const { user, isLoading } = useUser();
  const {
    mode,
    setMode,
    filterParams,
    updateParams,
    toggleLevel,
    toggleDifficulty,
  } = useTimelineFilter();

  if (isLoading) {
    return (
      <SectionLoader className="h-64 w-full" />
    );
  }

  if (!user) {
    return <LoginRequiredCard />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr] items-start">
        <aside className="lg:sticky lg:top-20 z-10">
          <div className="flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg/40 p-4 backdrop-blur-sm">
            <div className="flex flex-col gap-1">
              <FilterHeader label="表示モード" />
              <MenuButton
                isActive={mode === "all"}
                icon={Activity}
                label="すべて"
                onClick={() => setMode("all")}
              />
              <MenuButton
                isActive={mode === "played"}
                icon={UserCheck}
                label="自分がプレイ済み"
                onClick={() => setMode("played")}
              />
              <MenuButton
                isActive={mode === "overtaken"}
                icon={Swords}
                label="逆転された曲"
                activeVariant="destructive"
                onClick={() => setMode("overtaken")}
              />
            </div>

            <FilterCheckboxGroup
              label="LEVEL"
              items={[11, 12]}
              selected={filterParams.levels || []}
              onToggle={(lv: number) => toggleLevel(lv)}
              getLabel={(lv: number) => `☆${lv}`}
            />

            <FilterCheckboxGroup
              label="DIFFICULTY"
              items={["HYPER", "ANOTHER", "LEGGENDARIA"]}
              selected={filterParams.difficulties || []}
              onToggle={(diff: string) =>
                toggleDifficulty(
                  diff as import("@/types/songs/withScore").Difficulties,
                )
              }
              getLabel={(diff: string) => diff[0]}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="rounded-xl border border-bpim-border bg-bpim-bg p-2">
            <FilterSearchInput
              value={filterParams.search || ""}
              onChange={(search: string) => updateParams({ search })}
              placeholder="プレイヤー名または楽曲名で絞り込み..."
            />
          </div>

          <TimelineList mode={mode} params={filterParams} />
        </div>
      </div>
    </div>
  );
};

const FilterHeader = ({ label }: { label: string }) => (
  <span className="mb-1 px-1 text-[10px] font-bold tracking-widest text-bpim-muted uppercase">
    {label}
  </span>
);

const MenuButton = ({
  isActive,
  icon: Icon,
  label,
  onClick,
  activeVariant = "secondary",
}: {
  isActive: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  activeVariant?: "secondary" | "destructive";
}) => (
  <Button
    variant={isActive ? activeVariant : "ghost"}
    size="sm"
    onClick={onClick}
    className={cn(
      "w-full justify-start gap-3 px-3 transition-all",
      isActive
        ? "font-bold shadow-sm"
        : "font-medium text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text",
    )}
  >
    <Icon className={cn("h-4 w-4", isActive ? "" : "opacity-70")} />
    <span className="text-xs">{label}</span>
  </Button>
);
