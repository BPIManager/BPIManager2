import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg",
        "border border-bpim-border bg-bpim-surface-2/60",
        "px-2.5 py-2 text-base text-bpim-text md:text-sm",
        "placeholder:text-bpim-subtle",
        "transition-colors outline-none",
        "focus-visible:border-bpim-primary focus-visible:ring-3 focus-visible:ring-bpim-primary/30",
        "disabled:cursor-not-allowed disabled:bg-bpim-overlay/50 disabled:opacity-50",
        "aria-invalid:border-bpim-danger aria-invalid:ring-3 aria-invalid:ring-bpim-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
