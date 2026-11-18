import type { NextApiRequest, NextApiResponse } from "next";
import type { ZodSchema } from "zod";
import { invalidBody, invalidQuery, writeV2Result } from "@/middlewares/api/apiResult";

export function parseBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
  res: NextApiResponse,
): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return null;
  }
  return parsed.data;
}

export function parseQuery<T>(
  schema: ZodSchema<T>,
  query: NextApiRequest["query"],
  res: NextApiResponse,
): T | null {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: parsed.error.issues[0]?.message ?? "Invalid query parameters" });
    return null;
  }
  return parsed.data;
}

/** parseBody の v2 版。不正なときは v2 エンベロープ（errorDetails つき）で 400 を返す。メッセージは v1 と同じ */
export function parseBodyV2<T>(
  schema: ZodSchema<T>,
  body: unknown,
  res: NextApiResponse,
): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    writeV2Result(res, invalidBody(parsed.error, schema));
    return null;
  }
  return parsed.data;
}

/** parseQuery の v2 版。不正なときは v2 エンベロープ（errorDetails つき）で 400 を返す。メッセージは v1 と同じ */
export function parseQueryV2<T>(
  schema: ZodSchema<T>,
  query: NextApiRequest["query"],
  res: NextApiResponse,
): T | null {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    writeV2Result(res, invalidQuery(parsed.error, schema));
    return null;
  }
  return parsed.data;
}
