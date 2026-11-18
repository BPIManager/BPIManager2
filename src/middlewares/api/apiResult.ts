import type { NextApiResponse } from "next";
import { z } from "zod";
import type {
  ApiErrorDetails,
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
export function err(
  status: number,
  message: string,
  details?: ApiErrorDetails,
): HandlerResult<never> {
  return details
    ? { ok: false, status, message, details }
    : { ok: false, status, message };
}

/**
 * zod の検証エラー（400）を、不正なパラメータ（issues）と受け付けるパラメータの JSON Schema 付きで組み立てる。
 * メッセージは従来どおり「最初の issue のメッセージ、無ければ fallback」で、既存のクライアントには影響しない。
 * schema には検証に使ったものと同じ zod スキーマを渡す（定義とずれない）。
 *
 * @param options.in - schema が指すパラメータの置き場所
 * @param options.message - 指定するとメッセージを固定する
 * @param options.jsonSchema - 指定すると、zod スキーマから生成する代わりにこの JSON Schema を載せる（生成で落ちる列挙値を補った場合など）
 */
export function invalidParams(
  error: z.ZodError,
  schema: z.ZodType,
  options: {
    in?: "query" | "body";
    message?: string;
    fallback?: string;
    jsonSchema?: unknown;
  } = {},
): HandlerResult<never> {
  let jsonSchema: unknown = options.jsonSchema;
  if (jsonSchema === undefined) {
    try {
      jsonSchema = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
    } catch {
      // 変換できない型があっても、エラー応答そのものは必ず返す
      jsonSchema = undefined;
    }
  }
  return err(
    400,
    options.message ??
      error.issues[0]?.message ??
      options.fallback ??
      "Invalid parameters",
    {
      ...(options.in ? { in: options.in } : {}),
      issues: error.issues.map((i) => ({
        path: i.path.filter((p): p is string | number => typeof p !== "symbol"),
        code: i.code,
        message: i.message,
      })),
      ...(jsonSchema ? { schema: jsonSchema } : {}),
    },
  );
}

/**
 * 必須パラメータが無い（400）。どのパラメータが必要か（issues）と、受け付けるパラメータの JSON Schema を付ける。
 *
 * @param names - 不足しているパラメータ名（「いずれか」の場合は候補を並べる）
 * @param schema - 受け付けるパラメータの JSON Schema
 * @param options.hint - issues に載せる説明文
 */
export function missingParams(
  names: string[],
  schema: unknown,
  options: { in?: "query" | "body"; message?: string; hint?: string } = {},
): HandlerResult<never> {
  return err(400, options.message ?? "Required parameters are missing", {
    ...(options.in ? { in: options.in } : {}),
    issues: [
      {
        path: names,
        code: "missing_parameters",
        message: options.hint ?? `${names.join(" / ")} is required`,
      },
    ],
    schema,
  });
}

/** クエリパラメータの検証エラー。メッセージは従来の "Invalid query parameters" 系と同じ */
export function invalidQuery(error: z.ZodError, schema: z.ZodType) {
  return invalidParams(error, schema, {
    in: "query",
    fallback: "Invalid query parameters",
  });
}

/** リクエストボディの検証エラー。メッセージは従来の "Invalid request body" 系と同じ */
export function invalidBody(error: z.ZodError, schema: z.ZodType) {
  return invalidParams(error, schema, {
    in: "body",
    fallback: "Invalid request body",
  });
}

/** リクエストが API v2（/api/v2/...）か */
export function isV2Request(req: { url?: string }): boolean {
  return (req.url ?? "").startsWith("/api/v2/");
}

/**
 * v1・v2 で共有するミドルウェア（認証・リクエスト数制限など）のエラー応答を書く。
 * v2 は共通エンベロープ、v1 は従来どおり { message } で返す（v1 の形状は変えない）。
 */
export function writeMiddlewareError(
  req: { url?: string },
  res: NextApiResponse,
  status: number,
  message: string,
): void {
  if (isV2Request(req)) {
    writeV2Result(res, err(status, message));
    return;
  }
  res.status(status).json({ message });
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
      errorDetails: null,
      ...(result.meta ? { meta: toEnvelopeMeta(result.meta) } : {}),
    };
    res.status(200).json(payload);
    return;
  }
  const payload: ApiResponse<never> = {
    error: true,
    errorMessage: result.message,
    body: null,
    errorDetails: result.details ?? null,
  };
  res.status(result.status).json(payload);
}
