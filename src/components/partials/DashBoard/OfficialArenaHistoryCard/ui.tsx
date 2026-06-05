import { DashCard } from "@/components/ui/dashcard";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTooltip } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/common/useTranslation";
import dayjs from "@/lib/dayjs";
import { ArenaChart } from "./chart";
import { ActivePlayers } from "./ActivePlayers";
import { useActiveArenaPlayers } from "@/hooks/arena/useActiveArenaPlayers";
import {
  type Granularity,
  type ArenaHistoryState,
  type ArenaSummaryStats,
} from "@/hooks/arena/useArenaHistory";
import type {
  ArenaEventEntry,
  ArenaVersionMetadata,
} from "@/lib/cron/arena/types";

const ArenaSummaryCards = ({ stats }: { stats: ArenaSummaryStats }) => {
  const { t } = useTranslation();
  const items = [
    {
      label: t("dashboard.arenaHistory.summary.bestClass"),
      value: stats.bestClass ?? "-",
    },
    {
      label: t("dashboard.arenaHistory.summary.bestA1Continue"),
      value: stats.bestA1Continue !== null ? `${stats.bestA1Continue}回` : "-",
    },
    {
      label: t("dashboard.arenaHistory.summary.bestRank"),
      value: stats.bestRank !== null ? `${stats.bestRank}位` : "-",
    },
  ];
  return (
    <div className="mb-4 grid grid-cols-3 gap-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-bpim-border bg-bpim-surface-2 px-3 py-2 text-center"
        >
          <p className="text-[9px] text-bpim-muted">{label}</p>
          <p className="mt-0.5 text-sm font-black text-bpim-text">{value}</p>
        </div>
      ))}
    </div>
  );
};

const ArenaHistoryHelpContent = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <section>
        <p className="mb-1 border-b border-bpim-primary/30 font-bold text-bpim-primary">
          {t("dashboard.arenaHistory.help.overviewTitle")}
        </p>
        <p>{t("dashboard.arenaHistory.help.overviewDesc")}</p>
      </section>
      <section>
        <p className="mb-1 border-b border-bpim-primary/30 font-bold text-bpim-primary">
          {t("dashboard.arenaHistory.help.dataTitle")}
        </p>
        <p>{t("dashboard.arenaHistory.help.dataDesc")}</p>
      </section>
      <section>
        <p className="mb-1 border-b border-bpim-primary/30 font-bold text-bpim-primary">
          {t("dashboard.arenaHistory.help.chartTitle")}
        </p>
        <p>{t("dashboard.arenaHistory.help.chartDesc")}</p>
      </section>
      <section>
        <p className="mb-1 border-b border-bpim-primary/30 font-bold text-bpim-primary">
          {t("dashboard.arenaHistory.help.granularityTitle")}
        </p>
        <ul className="space-y-1">
          <li>{t("dashboard.arenaHistory.help.granularityDay")}</li>
          <li>{t("dashboard.arenaHistory.help.granularityWeek")}</li>
          <li>{t("dashboard.arenaHistory.help.granularitySeason")}</li>
        </ul>
      </section>
      <section>
        <p className="mb-1 border-b border-bpim-primary/30 font-bold text-bpim-primary">
          {t("dashboard.arenaHistory.help.aggregationTitle")}
        </p>
        <p>{t("dashboard.arenaHistory.help.aggregationDesc")}</p>
      </section>
    </div>
  );
};

export interface OfficialArenaHistoryCardUIProps {
  metadata: ArenaVersionMetadata | undefined;
  metaLoading: boolean;
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
  dataLoading: boolean;
  state: ArenaHistoryState;
  showActivePlayers?: boolean;
}

export const OfficialArenaHistoryCardUI = ({
  metadata,
  metaLoading,
  selectedIndex,
  onSelectIndex,
  dataLoading,
  state,
  showActivePlayers = false,
}: OfficialArenaHistoryCardUIProps) => {
  const { t } = useTranslation();
  const {
    granularity,
    setGranularity,
    countdown,
    isUpcoming,
    hasNoData,
    processedData,
    maxWinsDelta,
    hasRank,
    hasWins,
    summaryStats,
  } = state;

  const events = metadata?.events ?? [];
  const selectedEvent: ArenaEventEntry | undefined = events[selectedIndex];

  const now = Date.now();
  const isLive =
    !!selectedEvent &&
    now >= new Date(selectedEvent.start).getTime() &&
    now <= new Date(selectedEvent.end).getTime();

  const version = metadata?.version ?? "";
  const { data: activeData, isLoading: activeLoading } = useActiveArenaPlayers(
    version,
    isLive,
  );

  const GRANULARITY_OPTIONS: { id: Granularity; label: string }[] = [
    { id: "day", label: t("dashboard.arenaHistory.granularity.day") },
    { id: "week", label: t("dashboard.arenaHistory.granularity.week") },
    { id: "season", label: t("dashboard.arenaHistory.granularity.season") },
  ];

  return (
    <DashCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <p className="text-sm font-black text-bpim-text">
            {t("dashboard.arenaHistory.title")}
          </p>
          <HelpTooltip align="right">
            <ArenaHistoryHelpContent />
          </HelpTooltip>
        </div>
        {metaLoading ? (
          <Skeleton className="h-7 w-40 rounded-md" />
        ) : events.length > 0 ? (
          <select
            value={selectedIndex}
            onChange={(e) => onSelectIndex(Number(e.target.value))}
            className="rounded-md border border-bpim-border bg-bpim-surface-2 px-2 py-1 text-[11px] font-bold text-bpim-text focus:outline-none"
          >
            {events.map((ev, i) => (
              <option key={ev.round} value={i}>
                {t("dashboard.arenaHistory.round").replace(
                  "{n}",
                  String(ev.round),
                )}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {selectedEvent && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] text-bpim-muted">
            {dayjs(selectedEvent.start).tz().format("YYYY/M/D HH:mm")}
            {" 〜 "}
            {dayjs(selectedEvent.end).tz().format("YYYY/M/D HH:mm")} JST
          </p>
          <div className="flex gap-1">
            {GRANULARITY_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setGranularity(id)}
                className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                  granularity === id
                    ? "bg-bpim-primary text-white"
                    : "bg-bpim-surface-2 text-bpim-muted hover:bg-bpim-surface-3"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isUpcoming && countdown && (
        <div className="mb-5 rounded-xl border border-bpim-primary/20 bg-bpim-primary/5 px-4 py-4 text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-bpim-primary/70">
            {t("dashboard.arenaHistory.countdown.until").replace(
              "{n}",
              String(selectedEvent?.round ?? ""),
            )}
          </p>
          <div className="flex items-end justify-center gap-1">
            {[
              {
                value: countdown.d,
                key: "dashboard.arenaHistory.countdown.day" as const,
              },
              {
                value: countdown.h,
                key: "dashboard.arenaHistory.countdown.hour" as const,
              },
              {
                value: countdown.m,
                key: "dashboard.arenaHistory.countdown.min" as const,
              },
              {
                value: countdown.s,
                key: "dashboard.arenaHistory.countdown.sec" as const,
              },
            ].map(({ value, key }, i) => (
              <div key={key} className="flex items-end gap-0.5">
                {i > 0 && (
                  <span className="mb-1 text-lg font-black text-bpim-primary/40">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="font-mono text-2xl font-black tabular-nums text-bpim-primary">
                    {value}
                  </span>
                  <span className="text-[9px] text-bpim-muted">{t(key)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isUpcoming && hasNoData && !dataLoading && (
        <p className="py-8 text-center text-xs text-bpim-muted">
          {t("dashboard.arenaHistory.noData")}
        </p>
      )}

      {dataLoading && <Skeleton className="h-56 w-full rounded-lg" />}

      {!isUpcoming && summaryStats && !dataLoading && (
        <ArenaSummaryCards stats={summaryStats} />
      )}

      {processedData && (
        <ArenaChart
          data={processedData}
          maxWinsDelta={maxWinsDelta}
          hasRank={hasRank}
          hasWins={hasWins}
        />
      )}

      {isLive && showActivePlayers && <ActivePlayers data={activeData} isLoading={activeLoading} />}
    </DashCard>
  );
};
