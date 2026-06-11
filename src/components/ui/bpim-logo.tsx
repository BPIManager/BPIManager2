const BAR_SVG = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">` +
  `<rect x="2"  y="4"  width="4" height="24" rx="0.75" fill="${color}" opacity="0.35"/>` +
  `<rect x="10" y="11" width="4" height="17" rx="0.75" fill="${color}" opacity="0.9"/>` +
  `<rect x="18" y="17" width="4" height="11" rx="0.75" fill="${color}" opacity="0.35"/>` +
  `<rect x="26" y="24" width="4" height="4"  rx="0.75" fill="${color}" opacity="0.35"/>` +
  `</svg>`;

export function updateFavicon() {
  const hsl = getComputedStyle(document.documentElement)
    .getPropertyValue("--bpim-primary")
    .trim();
  if (!hsl) return;
  const url = `data:image/svg+xml,${encodeURIComponent(BAR_SVG(`hsl(${hsl})`))}`;
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

// Circle: cx=16 cy=16 r=13
// Bars must fit fully inside — corners verified against circle equation:
//   (x-16)² + (y-16)² ≤ 169
//
// BAR_W=3.5  GAP=1.5  totalW=18.5  startX=6.75  bottom=25
// Max safe height for outermost bars ≈ 18  (corner at x=6.75,y=7 → 166.6 < 169)

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

export const BpimLogo = ({ size = 32, className = "" }: BpimLogoProps) => (
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
