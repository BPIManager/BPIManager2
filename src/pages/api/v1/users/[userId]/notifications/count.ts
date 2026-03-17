import { notificationsRepo } from "@/lib/db/notifications";
import type { NextApiResponse } from "next";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { latestVersion } from "@/constants/latestVersion";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  const uid = String(req.authUid);

  try {
    const access = await checkProfileAccess(req, uid);
    if (!access.hasAccess)
      return res.status(403).json({ message: "Forbidden" });

    const count = await notificationsRepo.getUnreadCount(uid, latestVersion);
    return res.status(200).json(count);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export default withAuth(handler);
