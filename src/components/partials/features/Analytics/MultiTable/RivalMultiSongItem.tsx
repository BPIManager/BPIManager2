"use client";

import {
  SongInfo,
  ScoreBox,
  DiffBox,
  MobileScoreView,
} from "@/components/partials/common/Rivals/Table/ui";
import { targetKey } from "@/hooks/analytics/resolveMultiTargets";
import type { SongWithMultiTargets } from "@/hooks/analytics/useMultiAnalyticsComparison";
import type { AnalyticsTarget } from "@/types/analytics";

interface Props {
  song: SongWithMultiTargets;
  targets: AnalyticsTarget[];
  onClick: () => void;
}

/**
 * 複数ターゲット選択時の楽曲一覧の1行(#287)。
 *
 * `RivalSongItem`(1:1比較用、`/rivals/[userId]`と共有)は固定4列グリッドで
 * 列数を増やせないため、同じ見た目のサブコンポーネント(SongInfo・
 * ScoreBox・DiffBox)をそのまま再利用しつつ、選択したターゲットの数だけ
 * 「DIFF + ターゲットのScoreBox」を横並びに繰り返す可変列版として新設した。
 */
const RivalMultiSongItem = ({ song, targets, onClick }: Props) => {
  return (
    <div
      onClick={onClick}
      className="group relative w-full cursor-pointer border-b border-bpim-border bg-white/2 transition-colors hover:bg-bpim-overlay/50"
    >
      <div className="hidden lg:flex h-17 items-stretch">
        <div className="flex w-70 shrink-0 items-center px-4 min-w-0">
          <SongInfo song={song} />
        </div>
        <div className="flex w-35 shrink-0 items-stretch">
          <ScoreBox
            label="YOU"
            ex={song.exScore}
            bpi={song.bpi}
            clearState={song.clearState}
            colorClass="text-bpim-primary"
          />
        </div>
        <div className="flex shrink-0 overflow-x-auto">
          {targets.map((target) => {
            const value = song.targets[targetKey(target)];
            return (
              <div key={targetKey(target)} className="flex shrink-0 items-stretch">
                <div className="flex w-25 shrink-0 items-stretch">
                  <DiffBox
                    exDiff={
                      value?.exScore != null && song.exScore != null
                        ? song.exScore - value.exScore
                        : null
                    }
                    bpiDiff={
                      value?.bpi != null && song.bpi != null
                        ? Math.round((song.bpi - value.bpi) * 100) / 100
                        : null
                    }
                  />
                </div>
                <div className="flex w-35 shrink-0 items-stretch">
                  <ScoreBox
                    label={target.label || target.kind}
                    ex={value?.exScore ?? null}
                    bpi={value?.bpi ?? null}
                    clearState={null}
                    colorClass="text-bpim-warning"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-0 py-4 px-3 lg:hidden">
        <div className="mb-3">
          <SongInfo song={song} />
        </div>
        <div className="flex gap-3 overflow-x-auto">
          <MobileScoreView
            label="YOU"
            ex={song.exScore}
            bpi={song.bpi}
            clearState={song.clearState}
            align="start"
          />
          {targets.map((target) => {
            const value = song.targets[targetKey(target)];
            return (
              <MobileScoreView
                key={targetKey(target)}
                label={target.label || target.kind}
                ex={value?.exScore ?? null}
                bpi={value?.bpi ?? null}
                clearState={null}
                align="end"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RivalMultiSongItem;
