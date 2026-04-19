import type { NextApiRequest, NextApiResponse } from "next";
import type { ZodSchema } from "zod";

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
