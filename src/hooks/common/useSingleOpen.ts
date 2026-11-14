import { useCallback, useEffect, useRef, useState } from "react";

/** タップで開いたツールチップを閉じる操作の対象外にする要素（トリガーと、ポータルされた内容） */
const KEEP_OPEN_SELECTOR = "[data-tooltip-trigger], [data-radix-popper-content-wrapper]";

/**
 * 複数のツールチップのうち、同時に開くのを1つだけにするための状態管理。
 * 別の要素を開いたら前のものは閉じるため、素早くポインタを動かしても開いたまま残るものが出ない。
 * タッチ操作では指を離しても開いたままにし、トリガーの再タップか外側のタップで閉じる（内容内のボタンを押せるように）。
 */
export function useSingleOpen() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const lastPointerType = useRef<string>("mouse");
  const openKeyRef = useRef<string | null>(null);

  useEffect(() => {
    openKeyRef.current = openKey;
  }, [openKey]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      lastPointerType.current = e.pointerType;
      if (e.pointerType !== "touch" || openKeyRef.current === null) return;
      if (e.target instanceof Element && e.target.closest(KEEP_OPEN_SELECTOR)) return;
      setOpenKey(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  /** 全て閉じる（開いているツールチップを含む領域からポインタが出たときに呼ぶ） */
  const close = useCallback(() => setOpenKey(null), []);

  /**
   * `<Tooltip>` に渡す open / onOpenChange と、トリガーの onClick に渡す onTap。
   * タッチ中は Radix の開閉通知を無視し、onTap の開閉だけで状態を決める。
   */
  const getProps = (key: string) => ({
    open: openKey === key,
    onOpenChange: (open: boolean) => {
      if (lastPointerType.current === "touch") return;
      setOpenKey((cur) => (open ? key : cur === key ? null : cur));
    },
    onTap: () => {
      if (lastPointerType.current !== "touch") return;
      setOpenKey((cur) => (cur === key ? null : key));
    },
  });

  return { openKey, close, getProps };
}
