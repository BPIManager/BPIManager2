import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { apiKeysRepo } from "@/lib/db/apiKeys";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET": {
        const record = await apiKeysRepo.findByUserId(req.authUid);

        return res.status(200).json({
          exists: !!record,
          key: record ? `****${record.key.slice(-4)}` : null,
        });
      }

      case "PUT": {
        const newKey = crypto.randomBytes(32).toString("hex");

        await apiKeysRepo.upsert(req.authUid, newKey);

        return res.status(200).json({ key: newKey });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("API Key Management Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
