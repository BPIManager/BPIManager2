import { latestVersion } from "@/constants/iidx/iidxVersions";
import { userProfileRepo } from "@/lib/db/aggregates/userProfiles/profile";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  try {
    const user = await userProfileRepo.getMe(req.authUid, latestVersion);

    return res.status(200).json({ exists: !!user, user });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default withAuth(handler);
