import {
  getNotifications,
  markNotificationsRead,
} from "@/lib/subhandlers/notifications";
import {
  buildMeta,
  err,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const userId = req.authUid;
  const meta = buildMeta(userId, userId);

  try {
    if (req.method === "GET") {
      writeV2Result(res, withMeta(await getNotifications(userId, req.query), meta));
      return;
    }
    if (req.method === "POST") {
      writeV2Result(res, withMeta(await markNotificationsRead(userId), meta));
      return;
    }
    res.setHeader("Allow", ["GET", "POST"]);
    writeV2Result(res, err(405, `Method ${req.method} Not Allowed`));
  } catch (error: unknown) {
    writeV2Result(
      res,
      err(
        500,
        error instanceof Error ? error.message : "Internal Server Error",
      ),
    );
  }
}

export default withAuth(handler);
