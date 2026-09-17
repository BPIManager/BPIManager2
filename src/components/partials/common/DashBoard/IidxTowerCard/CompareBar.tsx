const fmt = (n: number) => n.toLocaleString("ja-JP");

function CompareBar({
  label,
  myValue,
  rivalValue,
  myName,
  rivalName,
  myColor,
  rivalColor,
}: {
  label: string;
  myValue: number;
  rivalValue: number;
  myName: string;
  rivalName: string;
  myColor: string;
  rivalColor: string;
}) {
  const total = myValue + rivalValue || 1;
  const myPct = Math.round((myValue / total) * 100);
  const rivalPct = 100 - myPct;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-bpim-muted">
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="tabular-nums w-16 truncate text-right font-bold text-bpim-text">
          {fmt(myValue)}
        </span>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-bpim-surface-3">
          <div
            className="transition-all duration-500"
            style={{ width: `${myPct}%`, backgroundColor: myColor }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${rivalPct}%`, backgroundColor: rivalColor }}
          />
        </div>
        <span className="tabular-nums w-16 truncate font-bold text-bpim-text">
          {fmt(rivalValue)}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[9px]">
        <span style={{ color: myColor }}>
          {myName} ({myPct}%)
        </span>
        <span style={{ color: rivalColor }}>
          ({rivalPct}%) {rivalName}
        </span>
      </div>
    </div>
  );
}

export default CompareBar;
