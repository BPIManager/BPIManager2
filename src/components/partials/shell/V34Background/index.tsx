import { useEffect, useRef } from "react";
import { useCurrentThemeId } from "@/hooks/common/useTheme";
import { BG_SPEED_FACTOR } from "@/hooks/themeBackground/createBgSettingsStore";
import { useV34BgSettings } from "@/hooks/v34/useV34Background";
import {
  PIXEL_SIZE,
  createGlitchBars,
  createPetals,
  drawBlossoms,
  drawGlitchBars,
  drawPetals,
  stepPetals,
  type GlitchBar,
  type Petal,
} from "@/lib/v34/sakura";

const CANVAS_CLASS =
  "pointer-events-none fixed inset-0 -z-1 h-full w-full [image-rendering:pixelated]";
const GLITCH_MIN_MS = 4000;
const GLITCH_MAX_MS = 9000;
const SMALL_SCREEN_PX = 640;

function V34Canvas() {
  const stillRef = useRef<HTMLCanvasElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const { enabled, speed } = useV34BgSettings();
  // 速度変更でアニメーションを作り直さないよう ref 経由で毎フレーム読む
  const speedRef = useRef(BG_SPEED_FACTOR[speed]);
  useEffect(() => {
    speedRef.current = BG_SPEED_FACTOR[speed];
  }, [speed]);

  useEffect(() => {
    const still = stillRef.current;
    const rain = rainRef.current;
    const stillCtx = still?.getContext("2d");
    const rainCtx = rain?.getContext("2d");
    if (!still || !rain || !stillCtx || !rainCtx) return;

    let petals: Petal[] = [];
    const resize = () => {
      const w = Math.ceil(window.innerWidth / PIXEL_SIZE);
      const h = Math.ceil(window.innerHeight / PIXEL_SIZE);
      still.width = rain.width = w;
      still.height = rain.height = h;
      drawBlossoms(stillCtx, w, h);
      const count = window.innerWidth < SMALL_SCREEN_PX ? 18 : 44;
      petals = createPetals(w, h, count);
      drawPetals(rainCtx, petals, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    let glitchBars: GlitchBar[] = [];
    let frame = 0;
    let glitchTimer = 0;
    let glitchEndTimer = 0;
    if (enabled) {
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(50, now - last) / 16.7;
        last = now;
        stepPetals(petals, rain.width, rain.height, speedRef.current, dt);
        drawPetals(rainCtx, petals, rain.width, rain.height);
        drawGlitchBars(rainCtx, glitchBars, rain.width);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      const scheduleGlitch = () => {
        const wait =
          (GLITCH_MIN_MS + Math.random() * (GLITCH_MAX_MS - GLITCH_MIN_MS)) /
          speedRef.current;
        glitchTimer = window.setTimeout(() => {
          if (!document.hidden) {
            still.classList.add("v34-glitch");
            glitchBars = createGlitchBars(rain.height);
            glitchEndTimer = window.setTimeout(() => {
              still.classList.remove("v34-glitch");
              glitchBars = [];
            }, 60 + Math.random() * 60);
          }
          scheduleGlitch();
        }, wait);
      };
      scheduleGlitch();
    }

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(glitchTimer);
      clearTimeout(glitchEndTimer);
      still.classList.remove("v34-glitch");
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  return (
    <>
      <canvas
        ref={stillRef}
        className={`${CANVAS_CLASS} opacity-60`}
        aria-hidden="true"
      />
      <canvas ref={rainRef} className={CANVAS_CLASS} aria-hidden="true" />
    </>
  );
}

export default function V34Background() {
  const themeId = useCurrentThemeId();
  if (themeId !== "dark-v34") return null;
  return <V34Canvas />;
}
