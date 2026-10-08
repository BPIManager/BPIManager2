import { DashCard } from "@/components/ui/dashcard";
import { versionsNonDisabledCollection } from "@/constants/iidx/versionTitles";
import type { TotalBpiVersionStats } from "@/types/siteStats";
import { useTranslation } from "@/hooks/common/useTranslation";

const VERSION_LABELS = new Map<string, string>(
  versionsNonDisabledCollection.map((v) => [v.value, v.label]),
);

const COLUMNS = ["mean", "median", "max", "min", "p25", "p75", "p90"] as const;

function TotalBpiVersionStatsTable({ data }: { data: TotalBpiVersionStats[] | undefined }) {
  const { t } = useTranslation();
  // cronが未再生成のstats.jsonにはこのキー自体が無いことがあるため、型上は必須でも
  // 実行時は無いものとして扱う
  const rows = data ?? [];

  return (
    <DashCard>
      <h3 className="mb-3 text-sm font-bold uppercase text-bpim-muted">
        {t("siteInfo.versionStats.title")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-xl text-xs">
          <thead>
            <tr className="border-b border-bpim-border text-bpim-muted">
              <th className="px-2 py-1.5 text-left font-bold">
                {t("siteInfo.versionStats.version")}
              </th>
              <th className="px-2 py-1.5 text-right font-bold">
                {t("siteInfo.versionStats.users")}
              </th>
              {COLUMNS.map((c) => (
                <th key={c} className="px-2 py-1.5 text-right font-bold">
                  {t(`siteInfo.versionStats.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.version} className="border-b border-bpim-border-dim last:border-b-0">
                <td className="px-2 py-1.5 text-left text-bpim-text">
                  {VERSION_LABELS.get(r.version) ?? r.version}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-bpim-text">
                  {r.userCount.toLocaleString()}
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c}
                    className={`px-2 py-1.5 text-right font-mono ${
                      c === "mean" || c === "median"
                        ? "font-bold text-bpim-text"
                        : "text-bpim-muted"
                    }`}
                  >
                    {r[c].toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}

export default TotalBpiVersionStatsTable;
