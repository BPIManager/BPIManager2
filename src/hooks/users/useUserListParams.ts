"use client";

import { useCallback } from "react";
import { useRouter } from "next/router";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import {
  RADAR_FILTER_KEYS as FILTER_KEYS,
  type RadarFilterKey,
  type RadarFilterRange,
} from "@/types/users/list";

type FlatQueryValue = string | number | null | undefined;

interface UserListQueryParams {
  q?: FlatQueryValue;
  p?: FlatQueryValue;
  s?: FlatQueryValue;
  o?: FlatQueryValue;
  v?: FlatQueryValue;
  seed?: FlatQueryValue;
  filters?: Partial<Record<RadarFilterKey, RadarFilterRange | null>>;
}

function parseFilters(
  query: Record<string, string | string[] | undefined>,
): Partial<Record<RadarFilterKey, RadarFilterRange>> {
  const filters: Partial<Record<RadarFilterKey, RadarFilterRange>> = {};
  for (const key of FILTER_KEYS) {
    const minRaw = query[`${key}Min`];
    const maxRaw = query[`${key}Max`];
    const min = minRaw !== undefined ? Number(minRaw) : undefined;
    const max = maxRaw !== undefined ? Number(maxRaw) : undefined;
    if ((min !== undefined && !Number.isNaN(min)) || (max !== undefined && !Number.isNaN(max))) {
      filters[key] = {
        ...(min !== undefined && !Number.isNaN(min) ? { min } : {}),
        ...(max !== undefined && !Number.isNaN(max) ? { max } : {}),
      };
    }
  }
  return filters;
}

/**
 * `filterUpdates` は差分ではなく絞り込み条件全体のスナップショットとして扱う
 * （渡されなかったキーはクリアする）。呼び出し元は常に完全な状態を渡すこと。
 */
function flattenFilters(
  filterUpdates: UserListQueryParams["filters"],
): Record<string, FlatQueryValue> {
  const flat: Record<string, FlatQueryValue> = {};
  if (!filterUpdates) return flat;
  for (const key of FILTER_KEYS) {
    const range = filterUpdates[key];
    flat[`${key}Min`] = range?.min ?? null;
    flat[`${key}Max`] = range?.max ?? null;
  }
  return flat;
}

/**
 * ユーザー一覧ページの URL クエリパラメータ（検索・ページ・ソート・順序・
 * バージョン・レーダー範囲絞り込み）を管理するフック。
 */
export function useUserListParams() {
  const router = useRouter();

  const q = (router.query.q as string) || "";
  const p = Number(router.query.p) || 1;
  const s = (router.query.s as string) || "totalBpi";
  const o = (router.query.o as string) || "distance";
  const v = (router.query.v as string) || latestVersion;
  const seed = router.query.seed ? Number(router.query.seed) : undefined;
  const filters = parseFilters(
    router.query as Record<string, string | string[] | undefined>,
  );

  const updateParams = useCallback(
    (newParams: UserListQueryParams) => {
      const { filters: filterUpdates, ...rest } = newParams;
      const merged = { ...router.query, ...rest, ...flattenFilters(filterUpdates) };
      const query = Object.fromEntries(
        Object.entries(merged).filter(([, val]) => val !== null && val !== undefined),
      );
      router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router],
  );

  const handleReset = useCallback(() => {
    updateParams({
      q: "",
      p: 1,
      s: "totalBpi",
      o: "distance",
      v: latestVersion,
      seed: null,
      filters: {},
    });
  }, [updateParams]);

  return { q, p, s, o, v, seed, filters, updateParams, handleReset };
}
