import { z } from "zod";
import { invalidParams } from "@/middlewares/api/apiResult";
import {
  INT_PARAM_SCHEMAS,
  PARAM_SCHEMAS,
  STRING_PARAM_SCHEMAS,
  type IntParamName,
  type ParamName,
  type StringParamName,
} from "@/schemas/common/params";
import type { HandlerResult } from "@/types/api";

/**
 * パスパラメータを共通スキーマで検証し、値を返す。不正なら null。
 * 検証ルールは schemas/common/params.ts だけにあり、エラー応答（invalidParam）も同じ定義から出す。
 */
export function parseStringParam(name: StringParamName, raw: unknown): string | null {
  const parsed = STRING_PARAM_SCHEMAS[name].safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** 整数のパスパラメータ（正の整数）を検証して数値で返す。不正なら null */
export function parseIntParam(name: IntParamName, raw: unknown): number | null {
  const parsed = INT_PARAM_SCHEMAS[name].safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * パスパラメータが不正なときの 400。errorMessage は従来の文言（message）をそのまま使い、
 * errorDetails には、どこがなぜ不正か（issues）と、受け付ける形（schema）を載せる。
 */
export function invalidParam(
  name: ParamName,
  raw: unknown,
  message: string,
): HandlerResult<never> {
  const schema = z.object({ [name]: PARAM_SCHEMAS[name] });
  const parsed = schema.safeParse({ [name]: raw });
  const error = parsed.success
    ? new z.ZodError([{ code: "custom", path: [name], message: "invalid value", input: raw }])
    : parsed.error;
  return invalidParams(error, schema, { in: "path", message });
}
