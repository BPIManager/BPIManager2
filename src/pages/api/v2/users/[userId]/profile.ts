import type { NextApiRequest, NextApiResponse } from "next";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "@/lib/subhandlers/profile";
import {
  buildMeta,
  err,
  withMeta,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const uid = req.query.userId as string;
  const isCompare = req.query.compare === "true";

  try {
    const access = await checkProfileAccess(req, uid);

    if (req.method === "GET") {
      const { result, targetUserId, viewerId } = await getProfile(
        uid,
        access,
        isCompare,
      );
      return writeV2Result(
        res,
        withMeta(result, buildMeta(viewerId, targetUserId)),
      );
    }

    if (req.method === "POST" || req.method === "PATCH") {
      if (!access.hasAccess || access.viewerId !== uid) {
        return writeV2Result(res, err(403, "Forbidden"));
      }
      const { result, targetUserId, viewerId } =
        req.method === "POST"
          ? await createProfile(req, uid)
          : await updateProfile(req, uid);
      return writeV2Result(
        res,
        withMeta(result, buildMeta(viewerId, targetUserId)),
      );
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    writeV2Result(res, err(405, "Method Not Allowed"));
  } catch (error) {
    console.error(error);
    writeV2Result(res, err(500, "Internal Server Error"));
  }
}
