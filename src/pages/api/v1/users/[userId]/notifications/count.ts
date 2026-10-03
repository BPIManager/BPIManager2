import { getUnreadCount } from "@/lib/subhandlers/notifications";
import { err, writeV1Result } from "@/middlewares/api/apiResult";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return writeV1Result(res, err(405, `Method ${req.method} Not Allowed`));
  }

  try {
    writeV1Result(res, await getUnreadCount(req.authUid));
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
