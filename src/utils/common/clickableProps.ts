import type { KeyboardEvent, SyntheticEvent } from "react";

/**
 * クリック可能な非ボタン要素（div 等）に、ボタン相当のロール・フォーカス・Enter/Space 操作を与える props。
 * 内側の入力要素などで発火したキー操作は無視する（要素自身へのキー操作のみ反応）。
 *
 * @param onClick - クリック・Enter・Space で呼ばれるハンドラー
 */
export function clickableProps(onClick: (e: SyntheticEvent<HTMLElement>) => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    },
  };
}
