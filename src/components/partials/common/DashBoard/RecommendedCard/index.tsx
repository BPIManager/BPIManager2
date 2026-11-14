import { useState } from "react";
import { useNeighborRecommendedInfinite } from "@/hooks/stats/useNeighborRecommended";
import { NeighborRecommendedItem } from "@/types/stats/neighborRecommended";
import SimpleRankItem from "./simpleRankItem";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { SongWithScore } from "@/types/songs/score";
import SongDetailView from "@/components/partials/modal/SongDetail";
import NearLoseList from "./NearLose";
import { DashCard } from "@/components/ui/dashcard";
import InfiniteScrollContainer from "@/components/partials/common/ListControls/InfiniteScroll/ui";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import { HelpTooltip } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/common/useTranslation";
import { invalidateDashboardRankingCache } from "@/hooks/stats/dashboardRankingCache";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRankingTabs } from "@/hooks/dashboard/useRankingTabs";
import { isSavedTabKey } from "@/lib/dashboard/rankingTabs";
import SavedComparisonPanel from "./SavedComparison";
import TabSettingsDialog from "./TabSettings";

const RankingCardHelpContent = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.ranking.help.mechanismTitle")}
        </p>
        <p>
          {t("dashboard.ranking.help.mechanismBefore")}
          <span className="text-bpim-primary font-bold">{t("dashboard.ranking.help.mechanismBpiLabel")}</span>
          {t("dashboard.ranking.help.mechanismMiddle")}
          <span className="text-bpim-warning font-bold">{t("dashboard.ranking.help.mechanismHighlight")}</span>
          {t("dashboard.ranking.help.mechanismAfter")}
        </p>
      </section>

      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.ranking.help.tabsTitle")}
        </p>
        <ul className="space-y-2">
          <li>
            <span className="font-bold">{t("dashboard.ranking.help.weaponsLabel")}</span>
            ：{t("dashboard.ranking.help.weaponsDesc")}
          </li>
          <li>
            <span className="font-bold">{t("dashboard.ranking.help.potentialLabel")}</span>
            ：{t("dashboard.ranking.help.potentialDesc")}
          </li>
        </ul>
      </section>

      <section>
        <p className="font-bold text-bpim-primary border-b border-bpim-primary/30 mb-1">
          {t("dashboard.ranking.help.nTitle")}
        </p>
        <p>
          {t("dashboard.ranking.help.nBefore")}
          <span className="font-bold">{t("dashboard.ranking.help.nHighlight")}</span>
          {t("dashboard.ranking.help.nAfter")}
        </p>
      </section>

      <section className="bg-bpim-overlay/40 p-2 rounded text-[10px]">
        <p>{t("dashboard.ranking.help.note")}</p>
      </section>
    </div>
  );
};

const NEIGHBOR_OPTIONS = [10, 20, 50] as const;
type NeighborN = (typeof NEIGHBOR_OPTIONS)[number];

interface NeighborInfiniteListProps {
  userId: string;
  type: "weapons" | "potential";
  n: NeighborN;
  onSelect: (item: NeighborRecommendedItem) => void;
}

const NeighborInfiniteList = ({
  userId,
  type,
  n,
  onSelect,
}: NeighborInfiniteListProps) => {
  const { levels, diffs, version } = useStatsFilter();
  const res = useNeighborRecommendedInfinite(
    userId,
    version,
    levels,
    diffs,
    type,
    n,
  );

  return (
    <InfiniteScrollContainer
      {...res}
      renderItem={(item: NeighborRecommendedItem, i: number) => (
        <SimpleRankItem
          key={`${item.songId}-${i}`}
          item={item}
          rank={i + 1}
          onClick={() => onSelect(item)}
        />
      )}
    />
  );
};

const RankingTabsCard = ({ userId }: { userId: string }) => {
  const { t } = useTranslation();
  const { version } = useStatsFilter();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [tab, setTab] = useState<string>("weapons");
  const [neighborN, setNeighborN] = useState<NeighborN>(20);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { entries, isLoading: tabsLoading, save } = useRankingTabs();

  const visibleTabs = entries.filter((e) => e.visible);
  // 選択中のタブが非表示にされた・削除された場合は先頭の表示タブへ寄せる
  const activeTab = visibleTabs.some((e) => e.key === tab)
    ? tab
    : (visibleTabs[0]?.key ?? "");
  const tabLabel = (key: string) => {
    const entry = entries.find((e) => e.key === key);
    if (entry?.comparison) return entry.comparison.name;
    return t(
      key === "weapons"
        ? "dashboard.ranking.weapons"
        : key === "potential"
          ? "dashboard.ranking.potential"
          : "dashboard.ranking.nearLose",
    );
  };

  const handleSongSelect = (item: SongWithScore) => {
    setSelectedSong(item);
    setIsDetailOpen(true);
  };

  return (
    <DashCard className="flex flex-col p-0 overflow-hidden border border-bpim-border">
      <Tabs value={activeTab} onValueChange={setTab} className="flex flex-col w-full">
        <div className="flex items-stretch">
          <div className="min-w-0 flex-1">
            {visibleTabs.length > 0 && (
              <AppTabsGroup
                visual="minimal"
                listClassName="overflow-x-auto"
                tabs={visibleTabs.map((e) => ({
                  value: e.key,
                  label: tabLabel(e.key),
                }))}
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="m-1 shrink-0 text-bpim-muted hover:text-bpim-text"
            onClick={() => setIsSettingsOpen(true)}
            disabled={tabsLoading}
            aria-label={t("dashboard.ranking.settings.open")}
            title={t("dashboard.ranking.settings.open")}
          >
            <Settings2 />
          </Button>
        </div>

        {(activeTab === "weapons" || activeTab === "potential") && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-bpim-border bg-bpim-surface-1">
            <span className="text-[10px] font-bold text-bpim-subtle">
              {t("dashboard.ranking.neighbor")}
            </span>
            {NEIGHBOR_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setNeighborN(opt)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                  neighborN === opt
                    ? "bg-bpim-primary text-white"
                    : "text-bpim-muted hover:text-bpim-text"
                }`}
              >
                {opt}{t("dashboard.ranking.neighborUnit")}
              </button>
            ))}
            <div className="ml-auto">
              <HelpTooltip align="right"><RankingCardHelpContent /></HelpTooltip>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar h-112.5">
          <TabsContent
            value="weapons"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NeighborInfiniteList
              userId={userId}
              type="weapons"
              n={neighborN}
              onSelect={handleSongSelect}
            />
          </TabsContent>
          <TabsContent
            value="potential"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NeighborInfiniteList
              userId={userId}
              type="potential"
              n={neighborN}
              onSelect={handleSongSelect}
            />
          </TabsContent>
          <TabsContent
            value="nearLose"
            className="m-0 p-0 focus-visible:outline-none"
          >
            <NearLoseList userId={userId} onSelect={handleSongSelect} />
          </TabsContent>
          {visibleTabs.filter((e) => isSavedTabKey(e.key)).map((e) => (
            <TabsContent
              key={e.key}
              value={e.key}
              className="m-0 p-0 focus-visible:outline-none"
            >
              <SavedComparisonPanel
                target={e.comparison?.targets[e.targetIndex]}
                onSelect={handleSongSelect}
              />
            </TabsContent>
          ))}
          {visibleTabs.length === 0 && (
            <p className="p-6 text-center text-sm text-bpim-muted">
              {t("dashboard.ranking.noTabs")}
            </p>
          )}
        </div>
      </Tabs>

      {isSettingsOpen && (
        <TabSettingsDialog
          isOpen
          entries={entries}
          onSave={save}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isDetailOpen && selectedSong && (
        <SongDetailView
          song={selectedSong}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          defaultTab={activeTab === "nearLose" ? "rivals" : "stats"}
          userId={userId}
          version={version}
          songDomain="bpi"
          onSaved={() => invalidateDashboardRankingCache(userId)}
        />
      )}
    </DashCard>
  );
};

export default RankingTabsCard;
