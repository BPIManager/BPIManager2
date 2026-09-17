import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { MockBpiHistoryChart } from "./mocks/MockBpiHistoryChart";
export { MockCurrentBpiCard } from "./mocks/MockCurrentBpiCard";
export { MockRadarChart } from "./mocks/MockRadarChart";
export { MockBpmBars } from "./mocks/MockBpmBars";
export { MockBpiDistribution } from "./mocks/MockBpiDistribution";
export { MockActivityCalendar } from "./mocks/MockActivityCalendar";
export { MockRivalBars } from "./mocks/MockRivalBars";

export const ShowcaseSection = ({
  tag,
  title,
  children,
  visual,
  flip = false,
}: {
  tag: string;
  title: string;
  children: ReactNode;
  visual: ReactNode;
  flip?: boolean;
}) => (
  <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-14">
    <div
      className={cn(
        "flex flex-col gap-4 lg:col-span-2",
        flip && "lg:order-last",
      )}
    >
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-bpim-primary">
        {tag}
      </span>
      <h3 className="text-xl font-bold leading-snug text-bpim-text md:text-2xl">
        {title}
      </h3>
      <div className="space-y-2 text-sm leading-relaxed text-bpim-muted">
        {children}
      </div>
    </div>
    <div className={cn("lg:col-span-3", flip && "lg:order-first")}>
      {visual}
    </div>
  </div>
);
