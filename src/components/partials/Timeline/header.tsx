import { cn } from "@/lib/utils";

export const TimelineHeader = () => {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex w-full flex-col",
        "border-b border-bpim-border bg-bpim-bg/80 backdrop-blur-md",
        "px-3 py-2",
      )}
    >
      <div className="grid grid-cols-[32px_1fr] gap-3">
        <div className="w-8" />

        <div className="grid grid-cols-[28px_1.5fr_1fr_1fr_1.2fr] gap-1">
          <HeaderText />
          <HeaderText className="text-right">RIVAL</HeaderText>
          <HeaderText className="text-right">GROWTH</HeaderText>
          <HeaderText className="text-right">YOU</HeaderText>
          <HeaderText className="text-right">DIFF</HeaderText>
        </div>
      </div>
    </div>
  );
};

const HeaderText = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "text-[9px] font-bold tracking-wider text-bpim-muted uppercase",
      className,
    )}
  >
    {children}
  </span>
);
