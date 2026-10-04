import { supportersRepo } from "@/lib/db/aggregates/userProfiles/supporters";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import type { HandlerResult } from "@/types/api";

/** GET /supporters */
export async function handleSupporters(): Promise<HandlerResult<unknown>> {
  try {
    const supporters = await supportersRepo.getSupporters(latestVersion);
    return ok({
      supporters: supporters.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        iidxId: u.iidxId,
        profileImage: u.profileImage,
        totalBpi:
          u.totalBpi !== null && u.totalBpi !== undefined
            ? Number(u.totalBpi)
            : null,
        role: {
          role: u.role,
          description: u.description ?? "",
          grantedAt: u.grantedAt,
        },
      })),
    });
  } catch (error: unknown) {
    return err(500, toErrorMessage(error));
  }
}
