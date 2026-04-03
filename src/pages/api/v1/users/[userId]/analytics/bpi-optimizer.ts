import type { NextApiRequest, NextApiResponse } from "next";
import { checkUserAccess, rejectAccess } from "@/middlewares/api/withApi";
import { bpiOptimizerRepo } from "@/lib/db/bpi-optimizer";
import { findOptimalBpiPath } from "@/lib/bpi/optimizer";
import { calculateRadar } from "@/lib/radar/calculator";
import { latestVersion } from "@/constants/latestVersion";
import topElements from "@/constants/radars/topElements.json";
import type { RadarCategory } from "@/types/stats/radar";
import type {
  SongOptimizerInput,
  OptimizerOptions,
  OptimizationResult,
} from "@/types/bpi-optimizer";

interface TopElement {
  title: string;
  difficulty: string;
  top: RadarCategory;
}

const topElementMap = new Map<string, RadarCategory>(
  (topElements as TopElement[]).map((e) => [
    `${e.title}___${e.difficulty}`,
    e.top,
  ]),
);

const ALL_RADAR_CATEGORIES: RadarCategory[] = [
  "NOTES",
  "CHORD",
  "PEAK",
  "CHARGE",
  "SCRATCH",
  "SOFLAN",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OptimizationResult | { message: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userId = String(req.query.userId);
  const targetBpi = parseFloat(String(req.query.targetBpi));
  const maxSteps = parseInt(String(req.query.maxSteps ?? "30"));

  const strategiesParam = String(req.query.strategies ?? "unplayed,played");
  const difficultiesParam = String(
    req.query.difficulties ?? "HYPER,ANOTHER,LEGGENDARIA",
  );
  const searchModeParam = String(req.query.searchMode ?? "flexible");
  const considerCurrentTotalBpi = req.query.considerCurrentTotalBpi !== "false";

  const radarElementsParam = String(
    req.query.radarElements ?? ALL_RADAR_CATEGORIES.join(","),
  );
  const selectedElements = radarElementsParam
    .split(",")
    .filter((e) =>
      ALL_RADAR_CATEGORIES.includes(e as RadarCategory),
    ) as RadarCategory[];

  if (isNaN(targetBpi) || targetBpi < -15 || targetBpi > 100) {
    return res
      .status(400)
      .json({ message: "targetBpi must be a number between -15 and 100" });
  }

  if (isNaN(maxSteps) || maxSteps < 1 || maxSteps > 400) {
    return res
      .status(400)
      .json({ message: "maxSteps must be a number between 1 and 400" });
  }

  const access = await checkUserAccess(req, userId);
  if (!access.hasAccess) return rejectAccess(res, access);

  const rawRows = await bpiOptimizerRepo.getAllSongsWithUserScores(
    userId,
    latestVersion,
  );

  if (rawRows.length === 0) {
    return res.status(200).json({
      steps: [],
      currentTotalBpi: -15,
      targetTotalBpi: targetBpi,
      achievable: false,
      alreadyAchieved: false,
      totalSongCount: 0,
    });
  }

  const radarCategoryBpis: Partial<Record<RadarCategory, number>> = {};
  const playedScores = rawRows
    .filter((r) => r.exScore !== null && r.bpi !== null)
    .map((r) => ({
      title: r.title,
      difficulty: r.difficulty,
      exScore: Number(r.exScore),
      notes: r.notes,
      bpi: r.bpi,
    }));

  if (playedScores.length > 0) {
    const radarResult = calculateRadar(playedScores);
    for (const cat of ALL_RADAR_CATEGORIES) {
      radarCategoryBpis[cat] = radarResult[cat].totalBpi;
    }
  }

  const validDifficulties = new Set(["HYPER", "ANOTHER", "LEGGENDARIA"]);
  const candidateDifficulties = difficultiesParam
    .split(",")
    .filter((d) => validDifficulties.has(d));

  const songs: SongOptimizerInput[] = rawRows.map((r) => ({
    songId: r.songId,
    title: r.title,
    difficulty: r.difficulty,
    difficultyLevel: r.difficultyLevel,
    notes: r.notes,
    kaidenAvg: r.kaidenAvg != null ? Number(r.kaidenAvg) : null,
    wrScore: r.wrScore != null ? Number(r.wrScore) : null,
    coef: r.coef != null ? Number(r.coef) : null,
    currentBpi: r.bpi != null ? Number(r.bpi) : -15,
    currentExScore: r.exScore != null ? Number(r.exScore) : null,
    isUnplayed: r.bpi == null,
    radarCategory: topElementMap.get(`${r.title}___${r.difficulty}`) ?? null,
  }));

  const strategies = strategiesParam.split(",").filter(Boolean);
  const isFiltered = selectedElements.length < ALL_RADAR_CATEGORIES.length;
  const radarElementFilter = isFiltered ? selectedElements : null;

  const baseOptions: OptimizerOptions & { searchMode: "fastest" | "flexible" } =
    {
      includeUnplayed: strategies.includes("unplayed"),
      includePlayed: strategies.includes("played"),
      radarCategoryBpis,
      radarElementFilter,
      candidateLevels: [12],
      candidateDifficulties,
      searchMode: searchModeParam === "fastest" ? "fastest" : "flexible",
      considerCurrentTotalBpi,
    };

  let result = findOptimalBpiPath(
    songs,
    songs.length,
    targetBpi,
    baseOptions,
    maxSteps,
  );

  if (!result.achievable && !result.alreadyAchieved && isFiltered) {
    const fallbackOptions = { ...baseOptions, radarElementFilter: null };
    const fallbackResult = findOptimalBpiPath(
      songs,
      songs.length,
      targetBpi,
      fallbackOptions,
      maxSteps,
    );
    if (
      fallbackResult.achievable ||
      fallbackResult.steps.length > result.steps.length
    ) {
      const note =
        "選択された要素の楽曲のみでは目標に到達できなかったため、全楽曲から再探索しました。";
      result = {
        ...fallbackResult,
        autoAdjustmentNote: fallbackResult.autoAdjustmentNote
          ? `${note} ${fallbackResult.autoAdjustmentNote}`
          : note,
      };
    }
  }

  return res.status(200).json(result);
}
