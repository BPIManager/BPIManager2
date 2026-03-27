"use client";

import { useCallback } from "react";
import { useRouter } from "next/router";

interface UserListQueryParams {
  q?: string;
  p?: number;
  s?: string;
  o?: string;
}

export function useUserListParams() {
  const router = useRouter();

  const q = (router.query.q as string) || "";
  const p = Number(router.query.p) || 1;
  const s = (router.query.s as string) || "totalBpi";
  const o = (router.query.o as string) || "distance";

  const updateParams = useCallback(
    (newParams: UserListQueryParams) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, ...newParams },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const handleReset = useCallback(
    () => updateParams({ q: "", p: 1, s: "totalBpi", o: "distance" }),
    [updateParams],
  );

  return { q, p, s, o, updateParams, handleReset };
}
