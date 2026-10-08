import { v4 as uuidv4 } from "uuid";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import {
  NATIONWIDE_AREA_ID,
  TOP_RANKER_AREA_NAMES,
  TOP_RANKER_VERSIONS,
} from "@/constants/iidx/topRankerAreas";
import { topRankersRankingRepo } from "@/lib/db/aggregates/topRankers/ranking";
import { statsLatestScoresRepo } from "@/lib/db/aggregates/stats/latestScores";
import { statsSongTablesRepo } from "@/lib/db/aggregates/stats/songTables";
import { maskPrivateIdentity } from "@/lib/db/shared/privacyMask";
import { calculateRadar, buildRadarSongMaster } from "@/lib/radar/calculator";
import { songMasterRepo } from "@/lib/db/domains/songs/master";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { AllDifficulties } from "@/types/songs/allSongs";
import { targetOf, type HandleOutcome } from "./_shared";

const DIFFICULTIES: readonly AllDifficulties[] = [
  "BEGINNER",
  "NORMAL",
  "HYPER",
  "ANOTHER",
  "LEGGENDARIA",
];

const csv = (v: unknown): string[] =>
  typeof v === "string" && v !== "" ? v.split(",") : [];

/** GET /users/[userId]/ranking/top-rankers?version=33&area=<areaId。省略時は全国(0)>&levels=11,12&difficulties=ANOTHER,HYPER */
export async function handleTopRankersRanking(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const targetUserId = targetOf(req);

  const { version, area = String(NATIONWIDE_AREA_ID) } = req.query;
  const areaId = Number(area);
  const levels = csv(req.query.levels).map(Number);
  const difficulties = csv(req.query.difficulties) as AllDifficulties[];

  if (
    typeof version !== "string" ||
    !(TOP_RANKER_VERSIONS as readonly string[]).includes(version) ||
    !Number.isInteger(areaId) ||
    areaId < 0 ||
    areaId >= TOP_RANKER_AREA_NAMES.length ||
    levels.some((lv) => !Number.isInteger(lv) || lv < 1 || lv > 12) ||
    difficulties.some((d) => !DIFFICULTIES.includes(d))
  ) {
    return { result: err(400, "Invalid query"), targetUserId, viewerId };
  }

  try {
    const [rows, viewerScores, fullMaster, validSongKeys] = await Promise.all([
      topRankersRankingRepo.getHolderRanking({
        version,
        areaId,
        levels,
        difficulties,
      }),
      statsLatestScoresRepo.getLatestScoresWithMusicData(viewerId, latestVersion),
      songMasterRepo.getSongMasterWithDef(),
      statsSongTablesRepo.getFilteredSongKeys(latestVersion),
    ]);

    const viewerRadar = calculateRadar(
      viewerScores,
      buildRadarSongMaster(fullMaster),
      validSongKeys,
    );

    const rankings = rows.map((u, i) => ({
      rank: i + 1,
      ...maskPrivateIdentity({
        isPublic: u.isPublic,
        userId: u.userId,
        userName: u.userName,
        profileImage: u.profileImage,
        anonId: uuidv4(),
      }),
      isPublic: u.isPublic,
      arenaClass: u.arenaClass,
      holdCount: Number(u.holdCount),
      isSelf: u.userId === viewerId,
    }));

    return {
      result: ok({
        rankings,
        totalCount: rankings.length,
        selfRank: rankings.find((u) => u.isSelf)?.rank ?? 0,
        viewerRadar,
      }),
      targetUserId,
      viewerId,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), targetUserId, viewerId };
  }
}
