interface SortButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function SortButton({ active, icon, label, onClick }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active
          ? "bg-bpim-primary text-bpim-bg"
          : "bg-bpim-overlay text-bpim-muted hover:text-bpim-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
