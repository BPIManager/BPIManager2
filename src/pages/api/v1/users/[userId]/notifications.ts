import { latestVersion } from "@/constants/latestVersion";
import { notificationsRepo } from "@/lib/db/notifications";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { notificationsQuerySchema } from "@/schemas/notifications/query";
import { parseBody } from "@/services/nextRequest/parseBody";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const userId = req.authUid;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  if (req.method === "GET") {
    const query = parseBody(notificationsQuerySchema, req.query, res);
    if (!query) return;

    const { type, page, limit } = query;
    const offset = page * limit;

    const items = await notificationsRepo.getNotifications({
      userId,
      type,
      limit,
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
