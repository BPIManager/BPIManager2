"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  LoaderIcon,
} from "lucide-react";
import { getStoredTheme } from "@/hooks/common/useTheme";

const Toaster = ({ ...props }: ToasterProps) => {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const id = getStoredTheme();
    setMode(id.startsWith("light") ? "light" : "dark");

    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute("data-theme") ?? "";
      setMode(theme.startsWith("light") ? "light" : "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={mode}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <LoaderIcon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--bpim-surface-2))",
          "--normal-text": "hsl(var(--bpim-text))",
          "--normal-border": "hsl(var(--bpim-border))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
