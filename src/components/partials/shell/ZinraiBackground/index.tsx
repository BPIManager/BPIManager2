import { useEffect, useRef } from "react";
import { useCurrentThemeId } from "@/hooks/common/useTheme";
import { PIXEL_SIZE, drawBlossoms } from "@/lib/zinrai/sakura";

const CANVAS_CLASS =
  "pointer-events-none fixed inset-0 -z-1 h-full w-full [image-rendering:pixelated]";

function ZinraiCanvas() {
  const stillRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const still = stillRef.current;
    const ctx = still?.getContext("2d");
    if (!still || !ctx) return;
    const draw = () => {
      still.width = Math.ceil(window.innerWidth / PIXEL_SIZE);
      still.height = Math.ceil(window.innerHeight / PIXEL_SIZE);
      drawBlossoms(ctx, still.width, still.height);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);

  return <canvas ref={stillRef} className={CANVAS_CLASS} aria-hidden="true" />;
}

export default function ZinraiBackground() {
  const themeId = useCurrentThemeId();
  if (themeId !== "dark-zinrai") return null;
  return <ZinraiCanvas />;
}
