import { useEffect, useRef } from "react";

export function useCountUp(target: number, active: boolean, delay = 0) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const startTime = performance.now() + delay * 1000;
    const step = (now: number) => {
      if (now < startTime) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const p = Math.min((now - startTime) / 1200, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (ref.current)
        ref.current.textContent = Math.round(e * target).toLocaleString();
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, delay]);
  return ref;
}

export function formatDate(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dateStr;
  return `${parseInt(m[2])}/${parseInt(m[3])}`;
}
