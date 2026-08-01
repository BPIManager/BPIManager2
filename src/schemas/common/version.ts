import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { z } from "zod";

/**
 * IIDXバージョンのクエリパラメータ用共通スキーマ。
 * 無効値（改ざん・古いブックマーク等）は最新バージョンへフォールバックする。
 */
export const iidxVersionQuerySchema = z
  .string()
  .refine(
    (v): v is (typeof IIDX_VERSIONS)[number] =>
      (IIDX_VERSIONS as readonly string[]).includes(v),
    { message: "Missing or invalid version parameter." },
  )
  .catch(latestVersion)
  .default(latestVersion);
