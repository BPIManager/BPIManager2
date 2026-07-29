"use client";

import { useInView } from "@/hooks/common/useInView";
import type { MonthlyReviewData } from "@/types/stats/monthlyReview";
import { useCountUp } from "./utils";
import { ArenaSectionUI } from "./ui";

interface Props {
  arena: MonthlyReviewData["arena"];
}

export const ArenaSection = ({ arena }: Props) => {
  const [ref, inView] = useInView(0.15);
  const a1Ref = useCountUp(arena?.maxA1Continue ?? null, inView, 0.7, 900);

  if (!arena) return null;

  return (
    <ArenaSectionUI
      arena={arena}
      inView={inView}
      sectionRef={ref as React.RefObject<HTMLDivElement>}
      a1Ref={a1Ref}
    />
  );
};
