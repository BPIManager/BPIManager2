import type { ReactNode } from "react";
import Fireworks from "react-canvas-confetti/dist/presets/fireworks";

interface Props {
  icon: ReactNode;
  title: string;
  subtitle: string;
  showFireworks: boolean;
  children?: ReactNode;
  actions: ReactNode;
}

export const ResultModalShell = ({
  icon,
  title,
  subtitle,
  showFireworks,
  children,
  actions,
}: Props) => {
  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-bpim-bg/80 backdrop-blur-sm p-4">
      {showFireworks && (
        <Fireworks
          autorun={{ speed: 2, duration: 1500 }}
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1001,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-1002 flex w-full max-w-100 flex-col items-center gap-7 rounded-2xl border border-bpim-border bg-bpim-surface-2 p-8 text-center shadow-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bpim-primary/10 text-bpim-primary">
          {icon}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-tight text-bpim-text uppercase">
            {title}
          </h2>
          <p className="text-sm font-medium text-bpim-muted">{subtitle}</p>
        </div>

        {children}

        <div className="flex w-full flex-col gap-3">{actions}</div>
      </div>
    </div>
  );
};
