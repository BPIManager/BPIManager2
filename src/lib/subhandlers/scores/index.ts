import { v4 as uuidv4 } from "uuid";
import type { NextApiRequest } from "next";
import dayjs from "@/lib/dayjs";
import topElements from "@/constants/iidx/radars/topElements";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { scoreDetailRepo } from "@/lib/db/domains/scores/detail";
import { scoresRepo } from "@/lib/db/domains/scores";
import { allScoresRepo } from "@/lib/db/domains/allScores";
import { timelineRepo } from "@/lib/db/domains/scores/timeline";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { songsRepo } from "@/lib/db/domains/songs";
import { allSongsRepo } from "@/lib/db/domains/allSongs";
import { unplayedSongsAggregateRepo } from "@/lib/db/aggregates/unplayedSongs";
import { saveImportResults } from "@/lib/db/orchestrators/bpiImport";
import { BpiCalculator } from "@/lib/bpi";
import { BpiImportService } from "@/lib/transfer/importer";
import { adminDb } from "@/lib/firebase/admin";
import { isScoreImproved } from "@/lib/scores/evaluateImprovement";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";
import { scoresQuerySchema, songHistoryQuerySchema } from "@/schemas/scores/query";
import { selfVersionComparisonQuerySchema } from "@/schemas/scores/query";
import { scoresBulkBodySchema } from "@/schemas/scores/bulk";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AccessResult } from "@/middlewares/api/withApi";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { HandlerResult } from "@/types/api";
import type { NewScore, NewAllScores } from "@/types/db";
import type { BpimScoreData } from "@/types/transfer";

/**
 * scores ドメイン（`users/[userId]/scores/**`）の subhandler 群。
 * ビジネスロジックを「`res` へ書き込む」形から切り離し、正規化した
 * `HandlerResult` を返す。v1/v2 のルートから共有する。
 *
 * 各 `handle*` は `{ result, targetUserId, viewerId }` を返す。ルート側は
 * v1 なら `writeV1Result(res, result)`、v2 なら
 * `writeV2Result(res, withMeta(result, buildMeta(viewerId, targetUserId)))`。
 */
export interface HandleOutcome<T> {
  result: HandlerResult<T>;
  targetUserId: string;
  viewerId: string | null;
}

const radarLookup = new Map<string, string>(
  (topElements as { title: string; difficulty: string; top: string }[]).map(
    (e) => [`${e.title}__${e.difficulty}`, e.top],
  ),
);

function targetOf(req: NextApiRequest): string {
  return typeof req.query.userId === "string" ? req.query.userId : "";
}

/** GET /users/[userId]/scores */
export async function handleScoresList(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = scoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { version, asOf, ...filterParams } = parsed.data;

  const time =
    !asOf || asOf === "latest"
      ? dayjs.tz().utc().toDate()
      : dayjs.tz(asOf).utc().toDate();

  try {
    const results = await scoreDetailRepo.getScoresWithDetails(
      targetUserId,
      version,
      { targetTime: time },
    );

    const songs = results.map(mapToFlatSong);
    const processed = sortSongs(
      filterSongsServerSide(songs, filterParams),
      filterParams,
    );

    return { result: ok(processed), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/[songId]/history */
export async function handleScoreHistory(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = songHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  try {
    const history = await scoresRepo.getHistoryForSong(
      targetUserId,
      parsed.data.songId,
    );

    const groupedHistory = history.reduce(
      (acc, record) => {
        const v = record.version || "unknown";
        if (!acc[v]) {
          acc[v] = [];
        }
        acc[v].push(record);
        return acc;
      },
      {} as Record<string, typeof history>,
    );

    return { result: ok(groupedHistory), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/best-ever */
export async function handleBestEver(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { currentVersion, excludeCurrent } = req.query;
  if (!currentVersion || typeof currentVersion !== "string") {
    return {
      result: err(400, "Missing or invalid currentVersion parameter."),
      targetUserId,
      viewerId,
    };
  }

  try {
    const rows = await timelineRepo.getBestEverScores({
      userId: targetUserId,
      currentVersion,
      excludeCurrent: excludeCurrent === "true",
    });

    const result = rows.map((row) => ({
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      bestExScore: row.bestExScore !== null ? Number(row.bestExScore) : null,
      bestBpi: row.bestBpi !== null ? Number(row.bestBpi) : null,
      bestVersion: row.bestVersion ?? null,
      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
    }));

    return { result: ok(result), targetUserId, viewerId };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}

/** GET /users/[userId]/scores/self-version */
export async function handleSelfVersion(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const parsed = selfVersionComparisonQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid query parameters",
      ),
      targetUserId,
      viewerId,
    };
  }

  const { currentVersion, targetVersion } = parsed.data;

  let rows: Awaited<ReturnType<typeof timelineRepo.getSelfVersionScores>>;
  try {
    rows = await timelineRepo.getSelfVersionScores({
      userId: targetUserId,
      currentVersion,
      targetVersion,
    });
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }

  const result = rows.map((row) => {
    const myEx =
      row.myExScore !== null && row.myExScore !== undefined
        ? Number(row.myExScore)
        : null;
    const prevEx =
      row.prevExScore !== null && row.prevExScore !== undefined
        ? Number(row.prevExScore)
        : null;
    const myBpi =
      row.myBpi !== null && row.myBpi !== undefined ? Number(row.myBpi) : null;
    const prevBpi =
      row.prevBpi !== null && row.prevBpi !== undefined
        ? Number(row.prevBpi)
        : null;

    return {
      songId: Number(row.songId),
      title: row.title,
      notes: Number(row.notes),
      bpm: row.bpm,
      difficulty: row.difficulty,
      difficultyLevel: Number(row.difficultyLevel),
      releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
      logId: null,
      exScore: myEx,
      bpi: myBpi,
      clearState: row.myClearState ?? null,
      missCount:
        row.myMissCount !== null && row.myMissCount !== undefined
          ? Number(row.myMissCount)
          : null,
      scoreAt: row.myLastPlayed ?? null,

      wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
      kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
      coef: row.coef !== null ? Number(row.coef) : null,
      rival: {
        exScore: prevEx,
        bpi: prevBpi,
        clearState: row.prevClearState ?? null,
        missCount:
          row.prevMissCount !== null && row.prevMissCount !== undefined
            ? Number(row.prevMissCount)
            : null,
        lastPlayed: row.prevLastPlayed ?? null,
      },

      exDiff: myEx !== null && prevEx !== null ? myEx - prevEx : undefined,
      bpiDiff:
        myBpi !== null && prevBpi !== null
          ? Math.round((myBpi - prevBpi) * 100) / 100
          : undefined,
      radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
    };
  });

  return { result: ok(result), targetUserId, viewerId };
}

/** GET /users/[userId]/scores/unplayed */
export async function handleUnplayed(
  req: NextApiRequest,
  access: AccessResult,
): Promise<HandleOutcome<unknown>> {
  const targetUserId = targetOf(req);
  const viewerId = access.viewerId ?? null;

  const { version, ...filterParams } = req.query;
  if (!version || typeof version !== "string") {
    return {
      result: err(400, "Missing or invalid version parameter."),
      targetUserId,
      viewerId,
    };
  }

  let rows: Awaited<
    ReturnType<typeof unplayedSongsAggregateRepo.getUnplayedSongs>
  >;
  try {
    rows = await unplayedSongsAggregateRepo.getUnplayedSongs(
      targetUserId,
      version,
    );
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }

  const songs = rows.map((row) => ({
    songId: Number(row.songId),
    title: row.title,
    notes: Number(row.notes || 0),
    bpm: row.bpm,
    difficulty: row.difficulty,
    difficultyLevel: Number(row.difficultyLevel),
    releasedVersion: row.releasedVersion ? Number(row.releasedVersion) : null,
    logId: null,
    exScore: null,
    bpi: null,
    clearState: null,
    missCount: null,
    scoreAt: null,
    wrScore: row.wrScore !== null ? Number(row.wrScore) : null,
    kaidenAvg: row.kaidenAvg !== null ? Number(row.kaidenAvg) : null,
    coef: row.coef !== null ? Number(row.coef) : null,
    radarTop: radarLookup.get(`${row.title}__${row.difficulty}`) ?? null,
  }));

  const processed = sortSongs(
    filterSongsServerSide(songs, filterParams),
    filterParams,
  );

  return { result: ok(processed), targetUserId, viewerId };
}

/** POST /users/[userId]/scores/bulk （本人のみ、withAuth） */
export async function handleScoresBulk(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const parsed = scoresBulkBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return {
      result: err(
        400,
        parsed.error.issues[0]?.message ?? "Invalid request body",
      ),
      ...base,
    };
  }

  const { version, csvRows } = parsed.data;
  const userId = viewerId;
  const batchId = uuidv4();

  try {
    const [
      bpiSongMaster,
      allLevelMaster,
      existingBpiScores,
      existingAllScores,
      lastLog,
    ] = await Promise.all([
      songsRepo.getSongMasterWithDef(),
      allSongsRepo.getAllLevelMaster(),
      scoresRepo.getLatestScores(userId, version),
      allScoresRepo.getLatestAllScores(userId, version),
      navigationRepo.getLatestTotalBpi(userId, version),
    ]);

    const bpiMasterMap = new Map(
      bpiSongMaster.map((s) => [`${s.title}_${s.difficulty}`, s]),
    );
    const allMasterMap = new Map(
      allLevelMaster.map((s) => [`${s.title}_${s.difficulty}`, s]),
    );

    const bpiScoreMap = new Map(existingBpiScores.map((s) => [s.songId, s]));
    const allScoreMap = new Map(existingAllScores.map((s) => [s.songId, s]));

    const scoreUpdates: NewScore[] = [];
    const allScoreUpdates: NewAllScores[] = [];
    const notFound: { title: string; difficulty: string }[] = [];
    const previousTotalBpi = lastLog?.totalBpi ?? -15;

    const lastPlayedDate = (dateStr: string | null) =>
      dateStr && dayjs(dateStr).isValid()
        ? dayjs.tz(dateStr).utc().toDate()
        : new Date();

    //全データ
    for (const row of csvRows) {
      const song = allMasterMap.get(`${row.title}_${row.difficulty}`);

      if (!song) {
        notFound.push({ title: row.title, difficulty: row.difficulty });
        continue;
      }

      const current = allScoreMap.get(song.songId);
      if (isScoreImproved(row, current)) {
        const bpiTarget = bpiMasterMap.get(`${row.title}_${row.difficulty}`);
        const bpiValue = bpiTarget
          ? BpiCalculator.calc(row.exScore, bpiTarget)
          : null;

        allScoreUpdates.push({
          userId,
          songId: song.songId,
          definitionId: null,
          exScore: row.exScore,
          bpi: bpiValue,
          clearState: row.clearState,
          missCount: row.missCount ?? null,
          lastPlayed: lastPlayedDate(row.lastPlayed),
          version,
          batchId,
        } as NewAllScores);
      }
    }

    // 11,12のみ
    for (const row of csvRows) {
      const song = bpiMasterMap.get(`${row.title}_${row.difficulty}`);
      if (!song) continue;

      const current = bpiScoreMap.get(song.songId);
      if (isScoreImproved(row, current)) {
        scoreUpdates.push({
          userId,
          songId: song.songId,
          definitionId: song.defId,
          exScore: row.exScore,
          bpi: BpiCalculator.calc(row.exScore, song),
          clearState: row.clearState,
          missCount: row.missCount ?? null,
          lastPlayed: lastPlayedDate(row.lastPlayed),
          version,
          batchId,
        } as NewScore);
      }
    }

    const twelves = bpiSongMaster.filter((s) => s.difficultyLevel === 12);
    const updatedBpiMap = new Map(scoreUpdates.map((s) => [s.songId, s.bpi]));

    const allBpisForTotal = twelves.map((song) => {
      if (updatedBpiMap.has(song.songId))
        return updatedBpiMap.get(song.songId)!;
      return bpiScoreMap.get(song.songId)?.bpi ?? -15;
    });

    const newTotalBpi = BpiCalculator.calculateTotalBPI(
      allBpisForTotal,
      twelves.length,
    );

    await saveImportResults({
      userId,
      version,
      batchId,
      scoreUpdates,
      allScoreUpdates,
      newTotalBpi,
    });

    return {
      result: ok({
        success: true,
        batchId,
        updatedAllCount: allScoreUpdates.length,
        updatedBpiCount: scoreUpdates.length,
        previousTotalBpi,
        newTotalBpi,
        details: { notFound },
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}

/** POST /users/[userId]/scores/transfer （本人のみ、withAuth） */
export async function handleScoresTransfer(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const service = new BpiImportService();

  try {
    const authUid = viewerId;
    const allDataToImport: { version: string; data: BpimScoreData }[] = [];

    for (const v of IIDX_VERSIONS) {
      for (const s of ["1"]) {
        const collectionName = `${v}_${s}`;
        const docRef = adminDb.collection(collectionName).doc(authUid);
        const snap = await docRef.get();

        if (snap.exists && snap.data()?.scoresHistory?.length > 0) {
          allDataToImport.push({
            version: v,
            data: snap.data() as BpimScoreData,
          });
          break;
        }
      }
    }

    if (allDataToImport.length === 0) {
      return {
        result: err(404, "No importable data found in Firestore."),
        ...base,
      };
    }

    const result = await service.saveMultipleFirestoreData(
      authUid,
      allDataToImport,
    );

    return {
      result: ok({
        message: "Transfer successful",
        importedVersions: allDataToImport.map((d) => d.version),
        totalProcessed: result.totalProcessed,
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
