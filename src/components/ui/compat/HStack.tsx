import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type HStackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  p?: number;
  px?: number;
  py?: number;
  w?: string;
  wrap?: boolean;
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function HStack({
  className,
  children,
  gap = 0,
  align = "center",
  justify = "start",
  wrap = false,
  p,
  px,
  py,
  w,
  style,
  ...rest
}: HStackProps) {
  return (
    <div
      className={cn(
        "flex flex-row",
        alignMap[align],
        justifyMap[justify],
        wrap && "flex-wrap",
        className,
      )}
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
