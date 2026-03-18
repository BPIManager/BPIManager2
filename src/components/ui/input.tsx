import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg",
        "border border-bpim-border bg-bpim-surface-2/60",
        "px-2.5 py-1 text-base text-bpim-text md:text-sm",
        "placeholder:text-bpim-subtle",
        "transition-colors outline-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent",
        "file:text-sm file:font-medium file:text-bpim-text",
        "focus-visible:border-bpim-primary focus-visible:ring-3 focus-visible:ring-bpim-primary/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        "disabled:bg-bpim-overlay/50 disabled:opacity-50",
        "aria-invalid:border-bpim-danger aria-invalid:ring-3 aria-invalid:ring-bpim-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
