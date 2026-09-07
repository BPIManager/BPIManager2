import type { NextApiRequest } from "next";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { statsTablesRepo } from "@/lib/db/aggregates/stats/tables";
import { userDiscoveryRepo } from "@/lib/db/aggregates/userProfiles/discovery";
import { navigationRepo } from "@/lib/db/domains/logs/navigation";
import { calculateRadar } from "@/lib/radar/calculator";
import { err, ok } from "@/middlewares/api/apiResult";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { authUidOf, type HandleOutcome } from "./_shared";

export async function handleRivalSuggestions(
  req: NextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = authUidOf(req);
  const base = { targetUserId: viewerId, viewerId };

  const { q, p, s, o, seed } = req.query;
  const currentPage = Math.max(1, Number(p || 1));
  const orderMode =
    (o as "distance" | "desc" | "newest" | "supporters") || "distance";
  const limit = orderMode === "supporters" ? 1000 : 20;
  const offset =
    orderMode === "supporters" ? 0 : (currentPage - 1) * limit;
  const sortKey = (s as string) || "totalBpi";

  try {
    const version = latestVersion;
    const viewerScores = await statsTablesRepo.getLatestScoresWithMusicData(
      viewerId,
      version,
    );
    const viewerRadar = calculateRadar(viewerScores);

    let viewerBaseValue: number;
    if (sortKey === "totalBpi") {
      const record = await navigationRepo.getLatestTotalBpi(viewerId, version);
      viewerBaseValue = record ? record.totalBpi : -15;
    } else {
      const category = sortKey.toUpperCase() as keyof typeof viewerRadar;
      viewerBaseValue = viewerRadar[category]?.totalBpi ?? -15;
    }
    const parsedSeed = seed ? Number(seed) : undefined;
    const recommendedUsers = await userDiscoveryRepo.getRecommendedUsers({
      viewerId,
      viewerValue: viewerBaseValue,
      version,
      limit,
      offset,
      searchQuery: q as string,
      sort: sortKey,
      order: orderMode,
      seed: parsedSeed,
    });

    return {
      result: ok({
        viewer: {
          userId: viewerId,
          totalBpi: viewerBaseValue,
          radar: viewerRadar,
        },
        users: recommendedUsers.map((user) => ({
          userId: user.userId,
          iidxId: user.iidxId,
          userName: user.userName,
          profileImage: user.profileImage,
          profileText: user.profileText,
          arenaClass: user.arenaClass ?? null,
          totalBpi: Number(user.totalBpi),
          updatedAt: user.createdAt,
          role: user.role
            ? {
                role: user.role,
                description: user.description ?? "",
                grantedAt: user.grantedAt,
              }
            : null,
          radar: {
            NOTES: Number(user.notes),
            CHORD: Number(user.chord),
            PEAK: Number(user.peak),
            CHARGE: Number(user.charge),
            SCRATCH: Number(user.scratch),
            SOFLAN: Number(user.soflan),
          },
        })),
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
