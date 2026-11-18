import { z } from "zod";

/**
 * パスパラメータ（req.query に入る [userId] [songId] など）の検証スキーマ。
 * 検証とエラー応答（原因の提示）は、ここの定義から出す。名前は pages/api のルート名と一致させる。
 */

/** 正の整数の文字列（"12" は通る。"12abc"・"1.5"・"0"・"" は通らない）を数値にする */
const positiveIntString = z
  .string()
  .regex(/^[1-9]\d{0,14}$/, "must be a positive integer")
  .transform(Number);

const nonEmptyString = z.string().min(1, "must not be empty");

/** 文字列のパスパラメータ */
export const STRING_PARAM_SCHEMAS = {
  userId: nonEmptyString,
  targetUserId: nonEmptyString,
  followerId: nonEmptyString,
  followingId: nonEmptyString,
  token: nonEmptyString,
  reportId: nonEmptyString,
  pattern: nonEmptyString,
} satisfies Record<string, z.ZodType<string>>;

/** 整数のパスパラメータ */
export const INT_PARAM_SCHEMAS = {
  songId: positiveIntString,
  noteId: positiveIntString,
  listId: positiveIntString,
  requestId: positiveIntString,
  id: positiveIntString,
} satisfies Record<string, z.ZodType<number, string>>;

export type StringParamName = keyof typeof STRING_PARAM_SCHEMAS;
export type IntParamName = keyof typeof INT_PARAM_SCHEMAS;
export type ParamName = StringParamName | IntParamName;

export const PARAM_SCHEMAS: Record<ParamName, z.ZodType> = {
  ...STRING_PARAM_SCHEMAS,
  ...INT_PARAM_SCHEMAS,
};

type ParamValue<K extends ParamName> = K extends IntParamName ? number : string;

/**
 * 複数のパスパラメータをまとめて検証するスキーマ。個々の定義（PARAM_SCHEMAS）をそのまま使う。
 */
export function pathParamsSchema<K extends ParamName>(
  ...names: K[]
): z.ZodType<{ [P in K]: ParamValue<P> }, unknown> {
  return z.object(
    Object.fromEntries(names.map((n) => [n, PARAM_SCHEMAS[n]])),
  ) as unknown as z.ZodType<{ [P in K]: ParamValue<P> }, unknown>;
}
