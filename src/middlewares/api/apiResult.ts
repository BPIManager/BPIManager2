import type { NextApiResponse } from "next";
import type {
  ApiMeta,
  ApiResponse,
  HandlerResult,
} from "@/types/api";
import type { AccessResult } from "./withApi";

/**
 * API v2 移行の基盤。ハンドラは HandlerResult を返し、writeV1Result / writeV2Result が res へ書き込む（docs/decisions/0009-api-v2-common-envelope.md）。
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
 * meta の共通欄（viewerId・isSelf）を組み立てる。isSelf は viewerId が対象 userId と一致するかで決まる。
 * extra で pagination 等を合成できる。未ログインの viewerId は null。
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
 * checkUserAccess / checkProfileAccess の AccessResult を HandlerResult のエラーへ変換する（許可時は null）。
 * `const denied = accessError(access); if (denied) return { result: denied, ... };` の形で使う。
 */
export function accessError(
  access: AccessResult,
): HandlerResult<never> | null {
  if (access.hasAccess) return null;
  return err(
    access.error?.status ?? 403,
    access.error?.message ?? "Forbidden",
  );
}

/**
 * 成功結果に meta を合成する（エラー結果はそのまま返す）。v1 アダプタは meta を無視するため、v2 ルートで writeV2Result と組み合わせて使う。
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
 * HandlerResult を v1 形式で res に書く薄いアダプタ。成功時は body をそのまま json() に渡し、既存の生形状を維持する。
 * transform を渡すと成功 body を整形してから書く。エラー時は { message } を返す。
 */
export function writeV1Result<T>(
  res: NextApiResponse,
  result: HandlerResult<T>,
  transform?: (body: T) => unknown,
  successStatus: number = 200,
): void {
  if (result.ok) {
    res
      .status(successStatus)
      .json(transform ? transform(result.body) : result.body);
    return;
  }
  res.status(result.status).json({ message: result.message });
}

/**
 * HandlerResult を v2 共通エンベロープで res に書き込む。HTTP ステータスは維持しつつ、body にも error / errorMessage を持たせる。
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
