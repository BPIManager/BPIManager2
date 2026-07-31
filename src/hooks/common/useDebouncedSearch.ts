"use client";

import { useState, useEffect, useRef } from "react";

/**
 * 入力値をデバウンスして確定値として伝播するフック。
 * externalValue が外部から変更された場合はローカル値も同期する。
 *
 * @param externalValue - 外部で管理されている確定済み検索値
 * @param onChange - デバウンス後に呼ばれるコールバック
 * @param delay - デバウンス遅延 (ms)
 */
export function useDebouncedSearch(
  externalValue: string,
  onChange: (val: string) => void,
  delay = 500,
) {
  const [localSearch, setLocalSearch] = useState(externalValue);

  // onChangeの参照が毎レンダリングで変わってもタイマーがリセットされないよう、
  // 最新のコールバックをrefで保持する
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // 外部からリセットされたときにローカル値を同期
  useEffect(() => {
    setLocalSearch(externalValue);
  }, [externalValue]);

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== externalValue) {
        onChangeRef.current(localSearch);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [localSearch, externalValue, delay]);

  const isTyping = localSearch !== externalValue;

  return { localSearch, setLocalSearch, isTyping };
}
