"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/common/useTranslation";
import { buildOgpImageUrl } from "@/lib/monthly-review/ogpUrl";
import { periodHeadingOf } from "@/lib/monthly-review/period";
import type { OgpSectionKey } from "@/lib/monthly-review/ogpSections";
import type {
  MonthlyReviewBpi,
  MonthlyReviewTopSongs,
  RadarGrowthEntry,
  MonthlyArena,
} from "@/types/stats/monthlyReview";
import { useShareDrawer } from "./context";
import ShareFabUI from "./ui";

interface Props {
  userId: string;
  month: string;
  version: string;
  granularity: "month" | "year" | "version";
  bpi: MonthlyReviewBpi | undefined;
  topSongs: MonthlyReviewTopSongs | undefined;
  radarGrowth: RadarGrowthEntry[] | null;
  arena: MonthlyArena | null;
  /** 全期間(version)モードでユーザーが選択中の比較先バージョン（前作比バッジ用） */
  compareVersion: string | undefined;
  sections: [OgpSectionKey, OgpSectionKey];
  onSectionsChange: (next: [OgpSectionKey, OgpSectionKey]) => void;
}

const ShareFab = ({
  userId,
  month,
  version,
  granularity,
  bpi,
  topSongs,
  radarGrowth,
  arena,
  compareVersion,
  sections,
  onSectionsChange,
}: Props) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { open, setOpen } = useShareDrawer();
  // 選択が変わって新しい組み合わせのPNGを取りに行くたびスケルトンに戻すため、
  // 「どのURLの読み込みが完了したか」をstateにしてレンダー中に比較する
  // （useEffect+setStateは無駄な再レンダーを招くため避ける）
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState<string | null>(null);

  const pageUrl =
    typeof window !== "undefined" ? `${window.location.origin}${router.asPath}` : "";

  // OGP画像の見出しと同じ文言にして、ツイート本文と添付画像で表現が食い違わないようにする
  const heading = periodHeadingOf(month, version, granularity);

  // 画像は選択中の2カラムの内容が変わるため、本文もその2項目に合わせて
  // 動的に生成する（OGP画像側のブロック内容と対応させる）
  const sectionLineOf = (key: OgpSectionKey): string | null => {
    switch (key) {
      case "topSongs": {
        const top = topSongs?.topBpiSongs[0];
        return top ? `🎵 BPIトップ: ${top.title}（BPI ${top.bpi.toFixed(2)}）` : null;
      }
      case "radar": {
        if (!radarGrowth || radarGrowth.length === 0) return null;
        const best = [...radarGrowth].sort((a, b) => b.bpiEnd - a.bpiEnd)[0];
        return `🎯 得意属性: ${best.element}（${best.bpiEnd.toFixed(1)}）`;
      }
      case "growth":
        return bpi
          ? `📈 期間の総合BPI推移: ${bpi.start.toFixed(2)} → ${bpi.end.toFixed(2)}`
          : null;
      case "arena":
        return arena
          ? `🥇 アリーナ: ${arena.bestClass}${arena.bestRank != null ? `（#${arena.bestRank}）` : ""}`
          : null;
    }
  };

  const shareText = [
    `${heading} ✨`,
    bpi
      ? `📊 総合BPI ${bpi.end.toFixed(2)}${bpi.diff !== 0 ? `（${bpi.diff >= 0 ? "+" : ""}${bpi.diff.toFixed(2)}）` : ""}`
      : null,
    sectionLineOf(sections[0]),
    sectionLineOf(sections[1]),
    "#IIDX #BPIM2",
  ]
    .filter(Boolean)
    .join("\n");

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
  const ogpPreviewUrl = buildOgpImageUrl({
    userId,
    version,
    month,
    sections,
    compareVersion,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  const previewLoaded = loadedPreviewUrl === ogpPreviewUrl;

  // 左右それぞれの枠で独立にラジオ選択する。同じ項目を両方に選べないよう、
  // 各枠のバッジ一覧は「もう片方の枠が今選んでいる項目」を候補から除外して渡す
  // （ui.tsx側）ため、ここでは選び直すだけでよい
  const handleSelectLeft = (key: OgpSectionKey) => {
    onSectionsChange([key, sections[1]]);
  };
  const handleSelectRight = (key: OgpSectionKey) => {
    onSectionsChange([sections[0], key]);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(pageUrl);
    toast.success(t("monthlyReview.shareFab.copied"));
  };

  return (
    <ShareFabUI
      open={open}
      onOpenChange={setOpen}
      sections={sections}
      onSelectLeft={handleSelectLeft}
      onSelectRight={handleSelectRight}
      previewUrl={ogpPreviewUrl}
      previewLoaded={previewLoaded}
      onPreviewLoad={() => setLoadedPreviewUrl(ogpPreviewUrl)}
      twitterUrl={twitterUrl}
      pageUrl={pageUrl}
      onCopyUrl={handleCopyUrl}
    />
  );
};

export default ShareFab;
