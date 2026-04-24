import { useEffect, useRef } from "react";
import type { Element as LordiconElement } from "@lordicon/element";

type Props = {
  src: string;
  trigger?:
    | "loop"
    | "hover"
    | "click"
    | "morph"
    | "boomerang"
    | "loop-on-hover";
  size?: number;
  colors?: string;
  className?: string;
};

export const LordiconAnimation = ({
  src,
  trigger = "loop",
  size = 48,
  colors,
  className,
}: Props) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    import("@lordicon/element").then(({ defineElement }) => {
      defineElement();
    });
  }, []);

  return (
    <lord-icon
      src={src}
      trigger={trigger}
      colors={colors}
      style={{ width: size, height: size } as React.CSSProperties}
      className={className}
    />
  );
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        trigger?: string;
        colors?: string;
        target?: string;
        stroke?: string;
        state?: string;
      };
    }
  }
}
