import { z } from "zod";
import { BpiCalculator } from "@/lib/bpi";
import { getArenaAverages } from "@/lib/cache/arenaAverages";
import {
  findSongWithDefByCorrectedTitle,
  getSongWithDefCached,
} from "@/lib/cache/songDefs";
import { scoreActivityRepo } from "@/lib/db/domains/scores/activity";
import { IIDX_DIFFICULTIES } from "@/constants/iidx/bpiDifficulties";
import { IIDX_VERSIONS, latestVersion } from "@/constants/iidx/iidxVersions";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, invalidParams, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";
import type { NextApiRequest } from "next";

/** BPI の計算モデル。v1=皆伝平均とWRの2アンカー、v2=分布ベース、both=両方 */
const BPI_MODELS = ["v1", "v2", "both"] as const;

const bpiCalcQuerySchema = z.object({
  title: z.string().min(1),
  difficulty: z.enum(IIDX_DIFFICULTIES),
  exScore: z.coerce.number().int().min(0),
  version: z
    .enum(IIDX_VERSIONS)
    .optional()
    .transform((v) => v ?? latestVersion),
  includeRank: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  model: z.enum(BPI_MODELS).optional().default("v2"),
});

/**
 * GET /bpi/calc
 *
 * @param options.allowModel - true のときだけ `model` パラメータを受け付ける（v2 ルート）。false では常に v2 で計算し、v1 ルートのレスポンスを変えない
 * @param options.correctTitle - true のとき、曲名が完全一致しなければ INFINITAS の固定対応表で直して探し直し、見つかれば警告つきで結果を返す（v2 ルート）
 */
export async function handleBpiCalc(
  req: NextApiRequest,
  options: { allowModel?: boolean; correctTitle?: boolean } = {},
): Promise<HandlerResult<unknown>> {
  const parsed = bpiCalcQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    // 詳細（issues・JSON Schema）は v2 のレスポンスだけに載せる。v1 ルートは従来どおり message のみ
    return options.allowModel
      ? invalidParams(parsed.error, bpiCalcQuerySchema)
      : err(400, "Invalid parameters");
  }

  const { title, difficulty, exScore, version, includeRank } = parsed.data;
  const model = options.allowModel ? parsed.data.model : "v2";

  try {
    let song = await getSongWithDefCached(title, difficulty);
    const warnings: { code: string; message: string; requestedTitle: string; resolvedTitle: string }[] = [];
    if (!song && options.correctTitle) {
      const corrected = await findSongWithDefByCorrectedTitle(title, difficulty);
      if (corrected) {
        song = corrected;
        warnings.push({
          code: "TITLE_CORRECTED",
          message: `曲名「${title}」は完全一致しなかったため、INFINITAS の表記の対応表で「${corrected.title}」として計算しました。アーケード公式CSVの表記で指定してください。`,
          requestedTitle: title,
          resolvedTitle: corrected.title,
        });
      }
    }
    if (!song) return err(404, "Song not found");

    if (exScore > song.notes * 2) {
      return err(400, `exScore exceeds maximum (${song.notes * 2})`);
    }

    const songData = {
      notes: song.notes,
      kaidenAvg: song.kaidenAvg ?? null,
      wrScore: song.wrScore ?? null,
      coef: song.coef ?? null,
      mu: song.mu ?? null,
      sigma: song.sigma ?? null,
      residualVar: song.residualVar ?? null,
    };
    const bpiV2 = BpiCalculator.calc(exScore, songData);
    const bpiV1 = BpiCalculator.calcV1(exScore, songData);
    const bpi = model === "v1" ? bpiV1 : bpiV2;

    // 推定順位は V2 の順位カーブに基づくため、V1 の値からは出さない
    const estimatedRankByFormula =
      model !== "v1" && bpiV2 !== null ? BpiCalculator.estimateRank(bpiV2) : null;

    const { rank: bpimRank, total: bpimTotal } = includeRank
      ? await scoreActivityRepo.getSongBpimRank(song.songId, exScore, version)
      : { rank: null, total: null };

    let arenaAverages = null;
    if (song.difficultyLevel === 11 || song.difficultyLevel === 12) {
      const entries = await getArenaAverages(version, song.difficultyLevel);
      const entry = entries?.find(
        (e) => e.title === song.title && e.difficulty === song.difficulty,
      );
      arenaAverages = entry?.averages ?? null;
    }

    return ok({
      song: {
        title: song.title,
        difficulty: song.difficulty,
        difficultyLevel: song.difficultyLevel,
        notes: song.notes,
      },
      bpi,
      ...(model === "both" ? { models: { v1: bpiV1, v2: bpiV2 } } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
      rank: { estimatedRank: estimatedRankByFormula, bpimRank, bpimTotal },
      metadata: { version, arenaAverages, ...(options.allowModel ? { model } : {}) },
    });
  } catch (error: unknown) {
    console.error("BPI calc error:", error);
    return err(500, toErrorMessage(error));
  }
}
