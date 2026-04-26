import * as React from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md",
          "origin-(--radix-tooltip-content-transform-origin)",
          "bg-bpim-surface-2 text-bpim-text ring-1 ring-bpim-border shadow-md",
          "px-3 py-1.5 text-xs",
          "has-data-[slot=kbd]:pr-1.5",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "**:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-bpim-surface-2 fill-bpim-surface-2" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

import { useState, useRef, useEffect, ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";

interface HelpTooltipProps {
  children: ReactNode;
  /** デスクトップでパネルを開く方向。右端に配置する場合は "right" を指定 */
  align?: "left" | "right";
}
export const HelpTooltip = ({ children, align = "left" }: HelpTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [isOpen]);

  const panelPositionCls =
    align === "right"
      ? "sm:right-0 sm:left-auto"
      : "sm:left-0 sm:right-auto";

  const arrowPositionCls =
    align === "right" ? "right-1.5 left-auto" : "left-1.5";

  return (
    <div className="relative inline-block ml-1" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center transition-colors focus:outline-none ${
          isOpen ? "text-bpim-primary" : "text-bpim-muted hover:text-bpim-primary"
        }`}
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <div
          className={`fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 sm:absolute sm:top-6 sm:translate-y-0 sm:w-80 ${panelPositionCls} max-h-[80vh] overflow-y-auto rounded-lg border border-bpim-border bg-bpim-surface p-4 shadow-2xl`}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-2 top-2 text-bpim-muted hover:text-bpim-text"
          >
            <X size={18} />
          </button>

          <div className="text-[11px] leading-relaxed text-bpim-light">
            {children}
          </div>

          <div
            className={`hidden sm:block absolute -top-1 h-2 w-2 rotate-45 border-l border-t border-bpim-border bg-bpim-surface ${arrowPositionCls}`}
          />
        </div>
      )}
    </div>
  );
};
