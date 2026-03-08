import { NextApiRequest, NextApiResponse } from "next";
import { UsersRepository } from "@/lib/db/users";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const access = await checkProfileAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }
    const authenticatedViewerId = access.viewerId;

    const repo = new UsersRepository();
    const profile = await repo.getUserProfileSummary(
      userId as string,
      authenticatedViewerId as string,
    );

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    if (profile.isPublic !== 1) {
      return res
        .status(403)
        .json({ message: "This profile is set as a private." });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
