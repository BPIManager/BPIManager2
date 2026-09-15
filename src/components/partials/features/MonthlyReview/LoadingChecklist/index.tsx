"use client";

import { Check, Loader2, X } from "lucide-react";

export type LoadingChecklistItemStatus = "loading" | "done" | "error";

export interface LoadingChecklistItem {
  key: string;
  label: string;
  status: LoadingChecklistItemStatus;
}

interface Props {
  items: LoadingChecklistItem[];
}

const iconFor = (status: LoadingChecklistItemStatus) => {
  if (status === "done") {
    return <Check className="h-3.5 w-3.5" style={{ color: "#34d399" }} />;
  }
  if (status === "error") {
    return <X className="h-3.5 w-3.5" style={{ color: "#f87171" }} />;
  }
  return (
    <Loader2
      className="h-3.5 w-3.5 animate-spin"
      style={{ color: "rgba(255,255,255,0.4)" }}
    />
  );
};

const LoadingChecklist = ({ items }: Props) => (
  <ul className="flex flex-col gap-2">
    {items.map((item) => (
      <li key={item.key} className="flex items-center gap-2.5">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              item.status === "done"
                ? "rgba(52,211,153,0.12)"
                : item.status === "error"
                  ? "rgba(248,113,113,0.12)"
                  : "transparent",
          }}
        >
          {iconFor(item.status)}
        </span>
        <span
          className="text-xs font-semibold"
          style={{
            color:
              item.status === "loading"
                ? "rgba(255,255,255,0.35)"
                : "rgba(255,255,255,0.75)",
          }}
        >
          {item.label}
        </span>
      </li>
    ))}
  </ul>
);

export default LoadingChecklist;
