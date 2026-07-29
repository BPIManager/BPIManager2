import { getArenaClassColor } from "@/utils/arenaClass";

const SPARKLE_POSITIONS_FREE = [
  { top: "-4px", left: "20%", delay: "0s" },
  { top: "50%", right: "-5px", delay: "1.2s" },
  { bottom: "-4px", left: "50%", delay: "2.4s" },
  { top: "10%", left: "-5px", delay: "0.8s" },
];

const SPARKLE_POSITIONS_CONTAINED = [
  { top: "10%", left: "10%", delay: "0s" },
  { top: "10%", left: "70%", delay: "1.2s" },
  { bottom: "10%", left: "40%", delay: "2.4s" },
  { bottom: "10%", left: "80%", delay: "0.8s" },
];

export const ArenaClassBadge = ({
  arenaClass,
  contained = false,
}: {
  arenaClass: string | null | undefined;
  size?: "sm" | "md";
  contained?: boolean;
}) => {
  const c = getArenaClassColor(arenaClass);
  const isA1 = arenaClass === "A1";

  const padding = contained ? "px-3 py-1" : "px-1.5 py-0.5";
  const fontSize = contained ? "text-sm" : "text-[9px]";

  const badge = (
    <span
      className={`inline-block rounded font-bold ${padding} ${fontSize} text-center`}
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow}`,
      }}
    >
      {arenaClass}
    </span>
  );

  if (!isA1) return badge;

  return (
    <>
      <style>{`
        @keyframes a1-particle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.6; transform: scale(1); }
        }
      `}</style>
      <span
        className={`relative inline-block${contained ? " overflow-hidden" : ""}`}
      >
        {(contained ? SPARKLE_POSITIONS_CONTAINED : SPARKLE_POSITIONS_FREE).map(
          (pos, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "#fbbf24",
                boxShadow: "0 0 4px #fbbf24",
                animation: `a1-particle 3.6s ease-in-out ${pos.delay} infinite`,
                top: (pos as { top?: string }).top,
                left: (pos as { left?: string }).left,
                right: (pos as { right?: string }).right,
                bottom: (pos as { bottom?: string }).bottom,
                pointerEvents: "none",
              }}
            />
          ),
        )}
        {badge}
      </span>
    </>
  );
};
