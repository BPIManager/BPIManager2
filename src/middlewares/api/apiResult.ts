import type { NextApiResponse } from "next";
import type {
  ApiMeta,
  ApiResponse,
  HandlerResult,
} from "@/types/api";

/**
 * API v2 移行の基盤ユーティリティ。
 * ハンドラは `HandlerResult` を返し、ここの `writeV1Result` / `writeV2Result` が
 * 実際に `res` へ書き込む。詳細は docs/decisions/0009-api-v2-common-envelope.md。
 */

/** 成功結果を組み立てる */
export function ok<T>(
  body: T,
  meta?: Partial<ApiMeta>,
): HandlerResult<T> {
  return meta ? { ok: true, body, meta } : { ok: true, body };
}

/** エラー結果を組み立てる（status は従来通りの HTTP ステータスコード） */
export function err(status: number, message: string): HandlerResult<never> {
  return { ok: false, status, message };
}

/**
 * meta の共通欄（viewerId / isSelf）を組み立てる。
 * `viewerId` は認証済み閲覧者の uid、未ログインは null を渡す。
 * `isSelf` は viewerId が閲覧対象 userId と一致するかで決まる。
 * `extra` で pagination 等を合成できる。
 */
export function buildMeta(
  viewerId: string | null,
  targetUserId: string,
  extra?: Partial<ApiMeta>,
): ApiMeta {
  return {
    viewerId,
    isSelf: viewerId !== null && viewerId === targetUserId,
    ...extra,
  };
}

/**
 * 成功結果に meta を合成する。エラー結果はそのまま返す。
 * v1 アダプタは meta を無視するため、v2 ルート側で
 * `writeV2Result(res, withMeta(result, buildMeta(...)))` のように使う。
 */
export function withMeta<T>(
  result: HandlerResult<T>,
  meta: Partial<ApiMeta>,
): HandlerResult<T> {
  return result.ok
    ? { ...result, meta: { ...result.meta, ...meta } }
    : result;
}

/** `HandlerResult.meta`（Partial）をエンベロープの `ApiMeta` へ正規化する */
function toEnvelopeMeta(meta: Partial<ApiMeta>): ApiMeta {
  return {
    viewerId: meta.viewerId ?? null,
    isSelf: meta.isSelf ?? false,
    ...(meta.pagination ? { pagination: meta.pagination } : {}),
  };
}

/**
 * `HandlerResult` を現行 v1 形式で `res` に書き込む薄いアダプタ。
 * 成功時は body をそのまま `json()` に渡し、既存エンドポイントの生形状
 * （配列 / 単発オブジェクト等）をそのまま維持する。`transform` を渡すと
 * 成功 body を整形してから書き込む。エラー時は `{ message }` を返す。
 */
export function writeV1Result<T>(
  res: NextApiResponse,
  result: HandlerResult<T>,
  transform?: (body: T) => unknown,
): void {
  if (result.ok) {
    res.status(200).json(transform ? transform(result.body) : result.body);
    return;
  }
  res.status(result.status).json({ message: result.message });
}

/**
 * `HandlerResult` を v2 共通エンベロープ形式で `res` に書き込むアダプタ。
 * HTTP ステータスコード（4xx/5xx）は従来通り維持しつつ、body 側にも
 * `error` / `errorMessage` を持たせる。
 */
export function writeV2Result<T>(
  res: NextApiResponse,
  result: HandlerResult<T>,
): void {
  if (result.ok) {
    const payload: ApiResponse<T> = {
      error: false,
      errorMessage: null,
      body: result.body,
      ...(result.meta ? { meta: toEnvelopeMeta(result.meta) } : {}),
    };
    res.status(200).json(payload);
    return;
  }
  const payload: ApiResponse<never> = {
    error: true,
    errorMessage: result.message,
    body: null,
  };
  res.status(result.status).json(payload);
}
