import { cn } from "@/lib/utils";
import { HTMLAttributes, JSX } from "react";

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  as?: keyof JSX.IntrinsicElements;
};

export function Text({
  className,
  as: Tag = "p",
  fontSize,
  fontWeight,
  color,
  style,
  ...rest
}: TextProps) {
  return (
    // @ts-expect-error dynamic tag
    <Tag
      className={cn(className)}
      style={{ fontSize, fontWeight, color, ...style }}
      {...rest}
    />
  );
}
