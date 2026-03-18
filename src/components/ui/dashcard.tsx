import { cn } from "@/lib/utils";

export const DashCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "w-full rounded-xl border border-bpim-border bg-bpim-surface p-5",
      className,
    )}
  >
    {children}
  </div>
);
