import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type VStackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  p?: number;
  px?: number;
  py?: number;
  w?: string;
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

export function VStack({
  className,
  children,
  gap = 0,
  align = "stretch",
  p,
  px,
  py,
  w,
  style,
  ...rest
}: VStackProps) {
  return (
    <div
      className={cn("flex flex-col", alignMap[align], className)}
      style={{
        gap: gap ? `${gap * 4}px` : undefined,
        padding: p ? `${p * 4}px` : undefined,
        paddingLeft: px ? `${px * 4}px` : undefined,
        paddingRight: px ? `${px * 4}px` : undefined,
        paddingTop: py ? `${py * 4}px` : undefined,
        paddingBottom: py ? `${py * 4}px` : undefined,
        width: w,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
