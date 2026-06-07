interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const SectionCard = ({
  children,
  className = "",
  style,
}: SectionCardProps) => (
  <div
    className={`w-full rounded-3xl px-6 py-8 sm:px-10 ${className}`}
    style={{
      background: "rgba(8,8,14,0.55)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      ...style,
    }}
  >
    {children}
  </div>
);
