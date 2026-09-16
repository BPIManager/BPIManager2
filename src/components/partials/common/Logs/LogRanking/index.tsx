import { useMemo, useState } from "react";
import { useLogRank } from "@/hooks/batches/useLogRank";
import type { BatchDetailItem } from "@/types/logs/batchDetail";
import type { SongWithScore } from "@/types/songs/score";
import { LabelWithTooltip } from "../LogSummary/ui";
import { Swords, TrendingUp, Trophy } from "lucide-react";
import { useTranslation } from "@/hooks/common/useTranslation";
import LogRankView from "./ui";

const LogRank = ({
  details,
  type,
  isSharing,
  userId,
  version,
  onScoreSaved,
}: {
  details: BatchDetailItem[];
  type: "growth" | "top" | "overtake" | "versionOvertake";
  isSharing?: boolean;
  userId?: string;
  version?: string;
  /** モーダル上でのEXスコア手動保存が成功した際に呼ばれる */
  onScoreSaved?: () => void;
}) => {
  const { t } = useTranslation();
  const [selectedSong, setSelectedSong] = useState<SongWithScore | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedRivalId, setSelectedRivalId] = useState<string>("");
  const [selectedTargetVersion, setSelectedTargetVersion] =
    useState<string>("");
  const [newOnly, setNewOnly] = useState<boolean>(false);

  const RANK_CONFIG = {
    growth: {
      title: t("logs.rank.growth.title"),
      icon: TrendingUp,
      accentColor: "text-bpim-success",
    },
    top: {
      title: t("logs.rank.top.title"),
      icon: Trophy,
      accentColor: "text-yellow-400",
    },
    overtake: {
      title: (
        <LabelWithTooltip
          label={t("logs.rank.overtake.title")}
          isSharing={false}
          tooltipText={t("logs.rank.overtake.tooltip")}
        />
      ),
      icon: Swords,
      accentColor: "text-bpim-warning",
    },
    versionOvertake: {
      title: (
        <LabelWithTooltip
          label={t("logs.rank.versionOvertake.title")}
          isSharing={false}
          tooltipText={t("logs.rank.versionOvertake.tooltip")}
        />
      ),
      icon: Swords,
      accentColor: "text-bpim-warning",
    },
  };

  const config = RANK_CONFIG[type];

  const allRivals = useMemo(() => {
    if (type !== "overtake") return [];
    const map = new Map<string, string>();
    for (const d of details) {
      for (const r of d.overtaken ?? []) {
        map.set(r.rivalUserId, r.rivalName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [details, type]);

  const allTargetVersions = useMemo(() => {
    if (type !== "versionOvertake") return [];
    const map = new Map<string, string>();
    for (const d of details) {
      for (const v of d.versionOvertaken ?? []) {
        map.set(v.targetVersion, v.targetVersionLabel);
      }
    }
    return Array.from(map.entries())
      .map(([targetVersion, label]) => ({ targetVersion, label }))
      .sort((a, b) => Number(b.targetVersion) - Number(a.targetVersion));
  }, [details, type]);

  // 期間移動・再取得等でdetailsが変わり、選択中の絞り込み対象(ライバル/
  // バージョン)が選択肢から消えた場合は未選択(すべて)扱いにする(#444)。
  // stateを直接補正せずrender時に導出することで、effect無しで解決する
  const effectiveRivalId = allRivals.some((r) => r.id === selectedRivalId)
    ? selectedRivalId
    : "";
  const effectiveTargetVersion = allTargetVersions.some(
    (v) => v.targetVersion === selectedTargetVersion,
  )
    ? selectedTargetVersion
    : "";

  const filteredDetails = useMemo(() => {
    if (type === "overtake" && effectiveRivalId) {
      return details.map((d) => ({
        ...d,
        overtaken: (d.overtaken ?? []).filter(
          (r) => r.rivalUserId === effectiveRivalId,
        ),
      }));
    }
    if (type === "versionOvertake" && effectiveTargetVersion) {
      return details.map((d) => ({
        ...d,
        versionOvertaken: (d.versionOvertaken ?? []).filter(
          (v) => v.targetVersion === effectiveTargetVersion,
        ),
      }));
    }
    return details;
  }, [details, type, effectiveRivalId, effectiveTargetVersion]);

  const {
    visibleSongs,
    hasMore,
    remainingCount,
    loadMore,
    hideNewRecords,
    setHideNewRecords,
    setDisplayLimit,
  } = useLogRank(filteredDetails, type);

  const handleOpenDetail = (item: BatchDetailItem) => {
    const mappedSong = {
      ...item,
      logId: null,
      scoreAt: null,
      bpm: item.bpm ?? null,
      releasedVersion: item.releasedVersion ?? null,
      wrScore: item.wrScore ?? null,
      kaidenAvg: item.kaidenAvg ?? null,
      coef: item.coef ?? null,
      exScore: item.current.exScore,
      bpi: item.current.bpi,
      clearState: item.current.clearState,
      missCount: item.current.missCount,
    };
    setSelectedSong(mappedSong);
    setIsDetailOpen(true);
  };

  const rivalCount = (id: string) =>
    details.filter((d) => (d.overtaken ?? []).some((o) => o.rivalUserId === id))
      .length;
  const versionCount = (targetVersion: string) =>
    details.filter((d) =>
      (d.versionOvertaken ?? []).some((o) => o.targetVersion === targetVersion),
    ).length;

  return (
    <LogRankView
      type={type}
      isSharing={isSharing}
      config={config}
      hideNew={{
        visible: type !== "top" && type !== "versionOvertake" && !isSharing,
        value: hideNewRecords,
        onChange: (checked) => {
          setHideNewRecords(checked);
          setDisplayLimit(5);
        },
      }}
      newOnly={{
        visible: type === "versionOvertake" && !isSharing,
        value: newOnly,
        onChange: setNewOnly,
      }}
      rivalFilter={
        type === "overtake"
          ? {
              value: effectiveRivalId,
              onChange: (v) => {
                setSelectedRivalId(v);
                setDisplayLimit(v ? 99999 : 5);
              },
              allCount: details.filter((d) => (d.overtaken ?? []).length > 0)
                .length,
              options: allRivals.map((r) => ({
                value: r.id,
                label: r.name,
                count: rivalCount(r.id),
              })),
            }
          : undefined
      }
      versionFilter={
        type === "versionOvertake"
          ? {
              value: effectiveTargetVersion,
              onChange: (v) => {
                setSelectedTargetVersion(v);
                setDisplayLimit(v ? 99999 : 5);
              },
              allCount: details.filter(
                (d) => (d.versionOvertaken ?? []).length > 0,
              ).length,
              options: allTargetVersions.map((v) => ({
                value: v.targetVersion,
                label: v.label,
                count: versionCount(v.targetVersion),
              })),
            }
          : undefined
      }
      visibleSongs={visibleSongs}
      onItemClick={handleOpenDetail}
      pagination={{ hasMore, remainingCount, onLoadMore: loadMore }}
      detailModal={{
        song: selectedSong,
        isOpen: isDetailOpen,
        onClose: () => setIsDetailOpen(false),
        userId,
        version,
        onSaved: onScoreSaved,
      }}
    />
  );
};

export default LogRank;
