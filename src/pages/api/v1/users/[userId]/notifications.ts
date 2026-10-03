import {
  getNotifications,
  markNotificationsRead,
} from "@/lib/subhandlers/notifications";
import { err, writeV1Result } from "@/middlewares/api/apiResult";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const userId = req.authUid;

  try {
    if (req.method === "GET") {
      writeV1Result(res, await getNotifications(userId, req.query));
      return;
    }
    if (req.method === "POST") {
      writeV1Result(res, await markNotificationsRead(userId));
      return;
    }
    res.setHeader("Allow", ["GET", "POST"]);
    writeV1Result(res, err(405, `Method ${req.method} Not Allowed`));
  } catch (error: unknown) {
    console.error(error);
    writeV1Result(
      res,
      err(
        500,
        "Internal Server Error",
      ),
    );
  }
}

export default withAuth(handler);
