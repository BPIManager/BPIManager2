import { useMemo } from "react";
import { RadarSectionChart } from "@/components/partials/DashBoard/Radar/index";
import { DifficultyBadge } from "@/components/partials/Songs/DifficultyBadge";
import { SONG_ATTRIBUTES } from "@/constants/songAttributes";
import type { SongListItem } from "@/types/songs/songInfo";
import { buildRadarData } from "@/utils/songs/songListFilter";

function buildTextageUrl(song: SongListItem, side: 1 | 2): string | null {
  if (!song.textage) return null;
  return `https://textage.cc/score/${song.textage.replace("?1", "?" + side)}`;
}

function buildYouTubeUrl(song: SongListItem): string {
  const sanitizedTitle = song.title.replace(/-/g, "");
  const query = encodeURIComponent(`${sanitizedTitle} IIDX`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

interface SongMetaCardProps {
  song: SongListItem;
}

export function SongMetaCard({ song }: SongMetaCardProps) {
  const textage1pUrl = useMemo(() => buildTextageUrl(song, 1), [song]);
  const textage2pUrl = useMemo(() => buildTextageUrl(song, 2), [song]);
  const youtubeUrl = useMemo(() => buildYouTubeUrl(song), [song]);

  const barItems = useMemo(
    () =>
      SONG_ATTRIBUTES.map(({ dbKey, label }) => ({
        label,
        value: song[dbKey as keyof SongListItem] as number | null,
      })).sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
    [song],
  );

  const udeoshiRaw = song.p_udeoshi;

  const hasAttributes = barItems.some(({ value }) => value !== null);

  return (
    <div className="rounded-xl border border-bpim-border bg-bpim-surface p-4 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex-1 flex flex-col gap-3">
        <div>
          <p className="text-lg font-bold text-bpim-text">{song.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DifficultyBadge
              difficulty={song.difficulty}
              level={song.difficultyLevel}
              size="md"
              truncate={false}
            />
            {textage1pUrl && textage2pUrl && (
              <div className="inline-flex rounded border border-bpim-border overflow-hidden">
                <a
                  href={textage1pUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors border-r border-bpim-border"
                >
                  textage 1P
                </a>
                <a
                  href={textage2pUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors"
                >
                  2P
                </a>
              </div>
            )}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-bpim-border bg-bpim-overlay/40 text-bpim-muted hover:text-bpim-text hover:bg-bpim-overlay transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-bpim-border bg-bpim-overlay/40 px-3 py-2">
            <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
              Notes
            </p>
            <p className="mt-0.5 font-mono font-bold text-bpim-text">
              {song.notes}
            </p>
          </div>
          <div className="rounded-lg border border-bpim-border bg-bpim-overlay/40 px-3 py-2">
            <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
              BPM
            </p>
            <p className="mt-0.5 font-mono font-bold text-bpim-text">
              {song.bpm}
            </p>
          </div>
          {song.wrScore && (
            <div className="rounded-lg border border-bpim-border bg-bpim-overlay/40 px-3 py-2">
              <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
                WR Score
              </p>
              <p className="mt-0.5 font-mono font-bold text-bpim-text">
                {song.wrScore}
              </p>
            </div>
          )}
          {song.kaidenAvg && (
            <div className="rounded-lg border border-bpim-border bg-bpim-overlay/40 px-3 py-2">
              <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
                皆伝平均
              </p>
              <p className="mt-0.5 font-mono font-bold text-bpim-text">
                {song.kaidenAvg}
              </p>
            </div>
          )}
        </div>

        {hasAttributes && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
                楽曲内評価
              </p>
              <div className="flex flex-col gap-1.5">
                {barItems.map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[10px] font-bold text-bpim-muted">
                      {label}
                    </span>
                    <div className="flex-1 rounded-full bg-bpim-overlay h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-bpim-primary/70"
                        style={{ width: `${value ?? 0}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-[10px] text-bpim-muted">
                      {value ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {udeoshiRaw !== null && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-bold text-bpim-muted uppercase tracking-widest">
                  腕押し度
                </p>
                <div className="relative h-1.5 rounded-full bg-bpim-overlay overflow-hidden">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-bpim-border z-10 -translate-x-px" />
                  {udeoshiRaw > 0 ? (
                    <div
                      className="absolute top-0 left-1/2 h-full rounded-r-full bg-bpim-primary/80"
                      style={{ width: `${udeoshiRaw / 2}%` }}
                    />
                  ) : udeoshiRaw < 0 ? (
                    <div
                      className="absolute top-0 right-1/2 h-full rounded-l-full bg-bpim-primary/40"
                      style={{ width: `${-udeoshiRaw / 2}%` }}
                    />
                  ) : null}
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold text-bpim-muted/60">
                  <span>← 指押し</span>
                  <span className="font-mono text-bpim-muted">
                    {udeoshiRaw > 0 ? "+" : ""}
                    {Math.round(udeoshiRaw)}
                  </span>
                  <span>腕押し →</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full sm:w-[280px] shrink-0">
        {hasAttributes ? (
          <RadarSectionChart
            data={{}}
            rivalData={buildRadarData(song, "global")}
            rivalOnly
            songAttr
          />
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-bpim-muted">
            属性データなし
          </div>
        )}
      </div>
    </div>
  );
}
