import { useEffect, useRef } from "react";

export function useCountUp(target: number | null, active: boolean, delay = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active || target == null) return;
    const startTime = performance.now() + delay * 1000;
    const step = (now: number) => {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const p = Math.min((now - startTime) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = String(Math.round(e * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, delay]);
  return ref;
}
