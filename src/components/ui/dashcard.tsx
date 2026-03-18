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
      "w-full rounded-xl border border-white/10 bg-[#0d1117] p-5",
      className,
    )}
  >
    {children}
  </div>
);
