import { NextApiRequest, NextApiResponse } from "next";
import { latestVersion } from "@/constants/latestVersion";
import { usersRepo } from "@/lib/db/users";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const supporters = await usersRepo.getSupporters(latestVersion);

    return res.status(200).json({
      supporters: supporters.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        iidxId: u.iidxId,
        profileImage: u.profileImage,
        totalBpi: u.totalBpi !== null && u.totalBpi !== undefined ? Number(u.totalBpi) : null,
        role: {
          role: u.role,
          description: u.description ?? "",
          grantedAt: u.grantedAt,
        },
      })),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ message: errorMessage });
  }
}
