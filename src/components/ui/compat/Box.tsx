import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BoxProps = HTMLAttributes<HTMLDivElement> & {
  p?: number;
  px?: number;
  py?: number;
  pt?: number;
  pb?: number;
  m?: number;
  mx?: number;
  my?: number;
  mt?: number;
  mb?: number;
  w?: string | number;
  h?: string | number;
  gap?: number;
  bg?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  flex?: number | string;
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  flexDirection?: string;
  overflow?: string;
  position?: string;
};

const spacingScale = (n?: number) =>
  n !== undefined ? `${n * 4}px` : undefined;

export function Box({
  className,
  style,
  p,
  px,
  py,
  pt,
  pb,
  m,
  mx,
  my,
  mt,
  mb,
  w,
  h,
  gap,
  bg,
  color,
  fontSize,
  fontWeight,
  borderRadius,
  flex,
  display,
  alignItems,
  justifyContent,
  flexDirection,
  overflow,
  position,
  ...rest
}: BoxProps) {
  return (
    <div
      className={cn(className)}
      style={{
        padding: spacingScale(p),
        paddingLeft: spacingScale(px),
        paddingRight: spacingScale(px),
        paddingTop: spacingScale(py) ?? spacingScale(pt),
        paddingBottom: spacingScale(py) ?? spacingScale(pb),
        margin: spacingScale(m),
        marginLeft: spacingScale(mx),
        marginRight: spacingScale(mx),
        marginTop: spacingScale(my) ?? spacingScale(mt),
        marginBottom: spacingScale(my) ?? spacingScale(mb),
        gap: spacingScale(gap),
        width: typeof w === "number" ? `${w * 4}px` : w,
        height: typeof h === "number" ? `${h * 4}px` : h,
        background: bg,
        color,
        fontSize,
        fontWeight,
        borderRadius,
        flex: typeof flex === "number" ? flex : undefined,
        display,
        alignItems,
        justifyContent,
        flexDirection: flexDirection as any,
        overflow,
        position: position as any,
        ...style,
      }}
      {...rest}
    />
  );
}
