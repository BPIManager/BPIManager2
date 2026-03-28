import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-50 rounded-full animate-spin ${className}`}
    />
  );
}

export function SectionLoader({
  className,
  size = "lg",
  color = "text-bpim-text",
}: {
  className?: string;
  size?: keyof typeof sizeMap;
  color?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <LoadingSpinner size={size} className={color} />
    </div>
  );
}

export function PageLoader({ size = "xl" }: Pick<LoadingSpinnerProps, "size">) {
  return (
    <div className="flex h-[90vh] w-full items-center justify-center">
      <LoadingSpinner size={size} className="text-bpim-text" />
    </div>
  );
}
