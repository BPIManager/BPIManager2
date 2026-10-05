import { useCurrentThemeId } from "@/hooks/common/useTheme";
import {
  PETAL_LOGO_GRID,
  PETAL_LOGO_PIXELS,
  petalLogoSvgString,
} from "@/lib/v34/petalLogo";
import {
  TRI_BAR_LOGO_GRID,
  TRI_BAR_LOGO_PIXELS,
  triBarLogoSvgString,
} from "@/lib/v20/triBarLogo";

const BAR_SVG = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">` +
  `<rect x="2"  y="4"  width="4" height="24" rx="0.75" fill="${color}" opacity="0.35"/>` +
  `<rect x="10" y="11" width="4" height="17" rx="0.75" fill="${color}" opacity="0.9"/>` +
  `<rect x="18" y="17" width="4" height="11" rx="0.75" fill="${color}" opacity="0.35"/>` +
  `<rect x="26" y="24" width="4" height="4"  rx="0.75" fill="${color}" opacity="0.35"/>` +
  `</svg>`;

export function updateFavicon() {
  const html = document.documentElement;
  const hsl = getComputedStyle(html).getPropertyValue("--bpim-primary").trim();
  if (!hsl) return;
  const themeId = html.getAttribute("data-theme");
  const svg =
    themeId === "dark-v34"
      ? petalLogoSvgString()
      : themeId === "light-v20"
        ? triBarLogoSvgString()
        : BAR_SVG(`hsl(${hsl})`);
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }
  link.href = url;
}

type BpimLogoProps = {
  size?: number;
  className?: string;
};

const hsl = (v: string) => `hsl(var(${v}))`;

// 円（cx=16, cy=16, r=13）に内接するバーの配置。最外バーの最大高さは約18（角が円周内に収まる上限）。
 // 各バー幅3.5・間隔1.5・startX=6.75・bottom=25 はこの前提で決めている。

const CX = 16;

const BAR_W = 4;
const BAR_GAP = 4;
const BAR_BOT = 28;
const startX = CX - (4 * BAR_W + 3 * BAR_GAP) / 2;

const bars = [
  { h: 24, you: false },
  { h: 17, you: true },
  { h: 11, you: false },
  { h: 4, you: false },
];

type LogoPixel = { x: number; y: number; color: string };

// テーマ固有のドット絵ロゴ。1ドット=1rect で描き、拡大してもにじまない
const PixelLogo = ({
  pixels,
  grid,
  size,
  className,
}: Required<BpimLogoProps> & { pixels: LogoPixel[]; grid: number }) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${grid} ${grid}`}
    shapeRendering="crispEdges"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {pixels.map(({ x, y, color }) => (
      <rect
        key={`${x}-${y}`}
        x={x}
        y={y}
        width={1.02}
        height={1.02}
        fill={color}
      />
    ))}
  </svg>
);

export const BpimLogo = ({ size = 32, className = "" }: BpimLogoProps) => {
  const themeId = useCurrentThemeId();
  if (themeId === "dark-v34") {
    return (
      <PixelLogo
        pixels={PETAL_LOGO_PIXELS}
        grid={PETAL_LOGO_GRID}
        size={size}
        className={className}
      />
    );
  }
  if (themeId === "light-v20") {
    return (
      <PixelLogo
        pixels={TRI_BAR_LOGO_PIXELS}
        grid={TRI_BAR_LOGO_GRID}
        size={size}
        className={className}
      />
    );
  }
  return <BarLogo size={size} className={className} />;
};

const BarLogo = ({ size, className }: Required<BpimLogoProps>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {bars.map(({ h, you }, i) => (
      <rect
        key={i}
        x={startX + i * (BAR_W + BAR_GAP)}
        y={BAR_BOT - h}
        width={BAR_W}
        height={h}
        rx={0.75}
        fill={hsl("--bpim-primary")}
        opacity={you ? 0.9 : 0.35}
      />
    ))}
  </svg>
);
