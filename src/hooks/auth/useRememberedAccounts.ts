"use client";

import { useCallback, useEffect, useState } from "react";
import { RememberedAccount } from "@/types/auth/rememberedAccount";
import {
  loadRememberedAccounts,
  removeRememberedAccount,
} from "@/utils/auth/rememberedAccounts";

export function useRememberedAccounts() {
  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);

  const refresh = useCallback(() => {
    setAccounts(
      [...loadRememberedAccounts()].sort(
        (a, b) => b.lastSwitchedAt - a.lastSwitchedAt,
      ),
    );
  }, []);

  useEffect(() => {
    // SSR時はlocalStorageが無くサーバー/クライアントで結果が変わるため、
    // hydration後にのみ読み込んでハイドレーションミスマッチを避ける
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const removeAccount = useCallback(
    (uid: string) => {
      removeRememberedAccount(uid);
      refresh();
    },
    [refresh],
  );

  return { accounts, removeAccount };
}
