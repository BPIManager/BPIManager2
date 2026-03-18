import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Center({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...rest}
    />
  );
}
