import { DashCard } from "@/components/ui/dashcard";
import { Button } from "@/components/ui/button";
import { useSongPopulation } from "@/hooks/siteStats/useSongPopulation";
import { useTranslation } from "@/hooks/common/useTranslation";

function SongPopulationTable({
  order,
  title,
}: {
  order: "top" | "bottom";
  title: string;
}) {
  const { songs, isLoading, loadMore, hasMore, total } = useSongPopulation(order);
  const { t, tFormat } = useTranslation();

  return (
    <DashCard>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-bpim-muted">{title}</h3>
        <span className="text-[10px] text-bpim-muted">
          {tFormat("siteInfo.songPop.total", { total: total.toLocaleString() })}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-bpim-border">
              <th className="pb-2 text-left font-bold text-bpim-muted">#</th>
              <th className="pb-2 text-left font-bold text-bpim-muted">
                {t("siteInfo.songPop.song")}
              </th>
              <th className="pb-2 text-left font-bold text-bpim-muted">
                {t("siteInfo.songPop.difficulty")}
              </th>
              <th className="pb-2 text-right font-bold text-bpim-muted">
                {t("siteInfo.songPop.players")}
              </th>
            </tr>
          </thead>
          <tbody>
            {songs.map((s, i) => (
              <tr key={s.songId} className="border-b border-bpim-border/40">
                <td className="py-1.5 text-bpim-muted">{i + 1}</td>
                <td className="py-1.5 font-medium text-bpim-text max-w-40 truncate">
                  {s.title}
                </td>
                <td className="py-1.5 text-bpim-muted">{s.difficulty}</td>
                <td className="py-1.5 text-right font-mono font-bold text-bpim-primary">
                  {s.playerCount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-xs text-bpim-muted"
          onClick={loadMore}
          disabled={isLoading}
        >
          {isLoading ? t("common.loading") : t("siteInfo.songPop.showMore")}
        </Button>
      )}
    </DashCard>
  );
}

export default SongPopulationTable;
