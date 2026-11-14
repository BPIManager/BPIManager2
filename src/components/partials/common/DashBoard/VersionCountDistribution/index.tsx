import { useRouter } from "next/router";
import { encodeTarget } from "@/hooks/analytics/targetCodec";
import { useStatsFilter } from "@/contexts/stats/FilterContext";
import { useVersionCountDistribution } from "@/hooks/stats/useVersionCountDistribution";
import DistributionChart from "../DistributionChart/ui";
import { DashCard } from "@/components/ui/dashcard";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import {
  getVersionNameFromNumber,
  verNameArr,
  versionTitles,
} from "@/constants/iidx/versionTitles";
import { useTranslation } from "@/hooks/common/useTranslation";

interface VersionCountDistributionSectionProps {
  myUserId?: string;
  rivalUserId?: string;
  myName?: string;
  rivalName?: string;
  /** 自分のダッシュボードのみ true。ツールチップに「比較を表示」ボタンを出す */
  showCompareAction?: boolean;
}

const UNKNOWN_LABEL = "other";

// INFINITASは遊んでいない人にも0本を出さないよう、取得結果に含まれるときだけ並べる
const KNOWN_VERSION_LABELS = versionTitles.map((v) => v.num).filter((n) => n !== "INF");

const getVersionColor = (label: string) => {
  const n = Number(label);
  if (Number.isNaN(n)) return "hsl(220 10% 55%)";
  return `hsl(${(n * 47) % 360} 55% 55%)`;
};

// サーバー側の並び（新しい順、INFINITASは数値バージョンの後ろ、不明は末尾）に合わせる
const labelRank = (label: string) => {
  if (label === UNKNOWN_LABEL) return -2;
  const n = Number(label);
  return Number.isNaN(n) ? -1 : n;
};
const compareLabelsDesc = (a: string, b: string) => labelRank(b) - labelRank(a);

const VersionCountDistributionSection = ({
  myUserId,
  rivalUserId,
  myName,
  rivalName,
  showCompareAction = false,
}: VersionCountDistributionSectionProps) => {
  const router = useRouter();
  const { levels, diffs } = useStatsFilter();
  const { t } = useTranslation();
  const effectiveMyName = myName ?? t("dashboard.me");

  // 全バージョンのベストが対象のため、バージョン比較(compareVersion)は適用せずライバル比較のみ対応する
  const effectiveRivalUserId = rivalUserId;
  const effectiveRivalName = rivalName ?? t("dashboard.rival");

  const {
    distribution: myDist,
    isLoading: myLoading,
    isError: myError,
  } = useVersionCountDistribution(myUserId, levels, diffs);
  const { distribution: rivalDist, isLoading: rivalLoading } =
    useVersionCountDistribution(effectiveRivalUserId, levels, diffs);

  const formatLabel = (label: string) =>
    label === UNKNOWN_LABEL
      ? t("dashboard.versionCount.other")
      : (verNameArr[Number(label)] ?? getVersionNameFromNumber(label));

  const formatAxisLabel = (label: string) =>
    label === UNKNOWN_LABEL
      ? t("dashboard.versionCount.other")
      : Number.isNaN(Number(label))
        ? label
        : `IIDX${label}`;

  // そのバージョンで自己歴代を出した譜面（今作で抜いたものは今作が歴代なので含まれない）の比較ページを開く
  const getAction = (label: string) =>
    showCompareAction && label !== UNKNOWN_LABEL
      ? {
          label: t("dashboard.versionCount.showCompare"),
          onClick: () =>
            router.push({
              pathname: "/analytics",
              query: {
                target: encodeTarget({
                  kind: "self-best",
                  label: t("analytics.kind.selfBest"),
                }),
                bestVersion: label,
                // 今作未プレイで過去作にだけ歴代がある曲も含めるため、自分側のプレイ状態は両方を対象にする
                isMyPlayed: "any",
                levels: levels.join(","),
                difficulties: diffs.join(","),
                page: "1",
              },
            }),
        }
      : undefined;

  const isLoading = myLoading || (!!effectiveRivalUserId && rivalLoading);

  if (myError) {
    return (
      <DashCard>
        <FetchErrorState error={myError} />
      </DashCard>
    );
  }

  // 歴代が無いバージョンも0件として並べ、比較側とも棒の位置が揃うよう、既知の数値バージョンと取得結果のラベルを統合する
  const fetched = [
    ...(myDist ?? []),
    ...(effectiveRivalUserId ? (rivalDist ?? []) : []),
  ].map((d) => d.label);
  const labels =
    fetched.length === 0
      ? []
      : Array.from(new Set([...KNOWN_VERSION_LABELS, ...fetched])).sort(
          compareLabelsDesc,
        );
  const align = (dist?: { label: string; count: number }[]) =>
    labels.map((label) => ({
      label,
      count: dist?.find((d) => d.label === label)?.count ?? 0,
    }));

  if (!isLoading && labels.length === 0) return null;

  return (
    <DistributionChart
      title={t("dashboard.versionCount.title")}
      myData={align(myDist)}
      isLoading={isLoading}
      getColor={getVersionColor}
      myName={effectiveMyName}
      skeletonCount={8}
      formatLabel={formatLabel}
      formatAxisLabel={formatAxisLabel}
      getAction={showCompareAction ? getAction : undefined}
      rivalComparison={
        effectiveRivalUserId && rivalDist
          ? { rivalData: align(rivalDist), rivalName: effectiveRivalName }
          : undefined
      }
    />
  );
};

export default VersionCountDistributionSection;
