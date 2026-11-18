import { z } from "zod";

/** よく使うクエリパラメータの検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

export const versionQuerySchema = z.object({
  version: z.string().min(1, "version is required"),
});

export const currentVersionQuerySchema = z.object({
  currentVersion: z.string().min(1, "currentVersion is required"),
});
