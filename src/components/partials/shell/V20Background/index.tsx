import { useEffect, useRef } from "react";
import { useCurrentThemeId } from "@/hooks/common/useTheme";
import { BG_SPEED_FACTOR } from "@/hooks/themeBackground/createBgSettingsStore";
import { useV20BgSettings } from "@/hooks/v20/useV20Background";
import { createRings, drawRings, type Ring } from "@/lib/v20/rings";

const SMALL_SCREEN_PX = 640;
const MAX_DPR = 2;

function V20Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { enabled, speed } = useV20BgSettings();
  // 速度変更でアニメーションを作り直さないよう ref 経由で毎フレーム読む
  const speedRef = useRef(BG_SPEED_FACTOR[speed]);
  useEffect(() => {
    speedRef.current = BG_SPEED_FACTOR[speed];
  }, [speed]);
  // 無効化→有効化で回転位置が飛ばないよう、累積時間はアニメーション間で引き継ぐ
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let rings: Ring[] = [];
    let sparse: boolean | null = null;
    let width = 0;
    let height = 0;
    const render = () => {
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      drawRings(ctx, rings, width, height, timeRef.current);
    };
    const resize = () => {
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // リングは画面サイズに応じて拡縮するだけで作り直さない（小画面⇔大画面の切替時のみ再生成）
      const nextSparse = width < SMALL_SCREEN_PX;
      if (nextSparse !== sparse) {
        sparse = nextSparse;
        rings = createRings(nextSparse);
      }
      render();
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    if (enabled) {
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(50, now - last) / 1000;
        last = now;
        timeRef.current += dt * speedRef.current;
        render();
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-1 h-full w-full"
      aria-hidden="true"
    />
  );
}

export default function V20Background() {
  const themeId = useCurrentThemeId();
  if (themeId !== "light-v20") return null;
  return <V20Canvas />;
}
