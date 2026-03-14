import { NextApiRequest, NextApiResponse } from "next";
import { checkProfileAccess } from "@/middlewares/api/withApiOnProfile";
import {
  handleGetProfile,
  handleCreateProfile,
  handleUpdateProfile,
} from "@/lib/subhandlers/userId-profile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { userId: targetUserId, compare } = req.query;
  const uid = targetUserId as string;

  try {
    const access = await checkProfileAccess(req, uid);

    switch (req.method) {
      case "GET":
        return await handleGetProfile(
          req,
          res,
          uid,
          access,
          compare === "true",
        );

      case "POST":
        console.log(access);
        if (!access.hasAccess || access.viewerId !== uid)
          return res.status(403).json({ message: "Forbidden" });
        return await handleCreateProfile(req, res, uid);

      case "PATCH":
        if (!access.hasAccess || access.viewerId !== uid)
          return res.status(403).json({ message: "Forbidden" });
        return await handleUpdateProfile(req, res, uid);

      default:
        res.setHeader("Allow", ["GET", "POST", "PATCH"]);
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
