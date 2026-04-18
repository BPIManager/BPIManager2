"use client";

import { useCallback } from "react";
import { useRouter } from "next/router";

interface UserListQueryParams {
  q?: string;
  p?: number;
  s?: string;
  o?: string;
  seed?: number | null;
}

/**
 * ユーザー一覧ページの URL クエリパラメータ（検索・ページ・ソート・順序）を管理するフック。
 *
 * @returns q・p・s・o の現在値、更新関数、リセット関数
 */
export function useUserListParams() {
  const router = useRouter();

  const q = (router.query.q as string) || "";
  const p = Number(router.query.p) || 1;
  const s = (router.query.s as string) || "totalBpi";
  const o = (router.query.o as string) || "distance";
  const seed = router.query.seed ? Number(router.query.seed) : undefined;

  const updateParams = useCallback(
    (newParams: UserListQueryParams) => {
      const merged = { ...router.query, ...newParams };
      const query = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== null && v !== undefined),
      );
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router],
  );

  const handleReset = useCallback(
    () => updateParams({ q: "", p: 1, s: "totalBpi", o: "distance", seed: null }),
    [updateParams],
  );

  return { q, p, s, o, seed, updateParams, handleReset };
}
