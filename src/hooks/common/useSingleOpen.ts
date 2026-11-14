import { useCallback, useState } from "react";

/**
 * 複数のツールチップのうち、同時に開くのを1つだけにするための状態管理。
 * 別の要素を開いたら前のものは閉じるため、素早くポインタを動かしても開いたまま残るものが出ない。
 */
export function useSingleOpen() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  /** 全て閉じる（開いているツールチップを含む領域からポインタが出たときに呼ぶ） */
  const close = useCallback(() => setOpenKey(null), []);

  /** `<Tooltip>` に渡す open / onOpenChange。閉じる通知は、自分が開いているときだけ反映する */
  const getProps = (key: string) => ({
    open: openKey === key,
    onOpenChange: (open: boolean) =>
      setOpenKey((cur) => (open ? key : cur === key ? null : cur)),
  });

  return { openKey, close, getProps };
}
