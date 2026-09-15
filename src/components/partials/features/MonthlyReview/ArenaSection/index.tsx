"use client";

import { useInView } from "@/hooks/common/useInView";
import type {
  MonthlyReviewData,
  ArenaVersionHistoryEntry,
} from "@/types/stats/monthlyReview";
import { useCountUp } from "../utils";
import ArenaSectionUI from "./ui";

interface Props {
  arena: MonthlyReviewData["arena"];
  versionHistory: ArenaVersionHistoryEntry[];
  granularity: "month" | "year" | "version";
}

const ArenaSection = ({ arena, versionHistory, granularity }: Props) => {
  const [ref, inView] = useInView(0.15);
  const a1Ref = useCountUp(arena?.maxA1Continue ?? null, inView, 0.7, 900);

  if (!arena && versionHistory.length === 0) return null;

  return (
    <ArenaSectionUI
      arena={arena}
      versionHistory={versionHistory}
      granularity={granularity}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      a1Ref={a1Ref}
    />
  );
};

export default ArenaSection;
