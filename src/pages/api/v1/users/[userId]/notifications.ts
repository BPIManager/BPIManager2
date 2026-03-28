import { latestVersion } from "@/constants/latestVersion";
import { notificationsRepo } from "@/lib/db/notifications";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const userId = req.authUid;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  if (req.method === "GET") {
    const { type = "all", page = "0", limit = "20" } = req.query;
    const offset = Number(page) * Number(limit);

    const items = await notificationsRepo.getNotifications({
      userId,
      type: type as "all" | "follow" | "overtaken",
      limit: Number(limit),
      latestVersion,
      offset,
    });

    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    await notificationsRepo.updateLastRead(userId);
    return res.status(200).json({ success: true });
  }
}

export default withAuth(handler);
