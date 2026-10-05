import { useEffect, useRef } from "react";
import type { Element as LordiconElement } from "@lordicon/element";
import { useCurrentThemeId } from "@/hooks/common/useTheme";
import { hslTripletToHex } from "@/utils/common/color";

/** アイコンの `primary` スロットに適用するテーマ色（`--bpim-*` のトークン名） */
type ColorToken = "primary" | "danger" | "warning" | "success" | "text-muted";

type Props = {
  src: string;
  trigger?:
    | "loop"
    | "hover"
    | "click"
    | "morph"
    | "boomerang"
    | "loop-on-hover"
    | "once";
  size?: number;
  colors?: string;
  colorToken?: ColorToken;
  className?: string;
};

export const LordiconAnimation = ({
  src,
  trigger = "loop",
  size = 48,
  colors,
  colorToken,
  className,
}: Props) => {
  const themeId = useCurrentThemeId();
  const initialized = useRef(false);
  const iconRef = useRef<LordiconElement>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    import("@lordicon/element").then(({ defineElement }) => {
      defineElement();
      if (trigger === "once") {
        const el = iconRef.current;
        if (!el) return;
        el.readyPromise.then(() => el.playerInstance?.playFromStart());
      }
    });
  }, [trigger]);

  // テーマ切替に追従して色を差し替える（SSR との属性不一致を避けるため DOM を直接更新する）
  useEffect(() => {
    const el = iconRef.current;
    if (!el || !colorToken || colors) return;
    const hsl = getComputedStyle(document.documentElement).getPropertyValue(
      `--bpim-${colorToken}`,
    );
    const hex = hslTripletToHex(hsl);
    if (hex) el.setAttribute("colors", `primary:${hex}`);
  }, [colorToken, colors, themeId]);

  return (
    <lord-icon
      ref={iconRef as React.RefObject<HTMLElement>}
      src={src}
      trigger={trigger !== "once" ? trigger : undefined}
      colors={colors}
      style={{ width: size, height: size } as React.CSSProperties}
      className={className}
    />
  );
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSXの型宣言マージにnamespaceが必須
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
