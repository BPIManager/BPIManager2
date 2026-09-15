"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ShareDrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ShareDrawerContext = createContext<ShareDrawerContextValue | null>(null);

/**
 * シェアパネル（Vaul Drawer）の開閉状態。右下FABとフッターのシェアボタンなど、
 * ページ内の離れた場所から同じパネルを開けるようにするため、状態をContextで共有する
 */
export function ShareDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ShareDrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </ShareDrawerContext.Provider>
  );
}

export function useShareDrawer(): ShareDrawerContextValue {
  const ctx = useContext(ShareDrawerContext);
  if (!ctx) {
    throw new Error("useShareDrawer must be used within a ShareDrawerProvider");
  }
  return ctx;
}
