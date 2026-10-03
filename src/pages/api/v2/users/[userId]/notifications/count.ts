import { getUnreadCount } from "@/lib/subhandlers/notifications";
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return writeV2Result(res, err(405, `Method ${req.method} Not Allowed`));
  }

  const userId = req.authUid;

  try {
    writeV2Result(
      res,
      withMeta(await getUnreadCount(userId), buildMeta(userId, userId)),
    );
  } catch (error: unknown) {
    console.error(error);
    writeV2Result(
      res,
      err(
        500,
        "Internal Server Error",
      ),
    );
  }
}

export default withAuth(handler);
