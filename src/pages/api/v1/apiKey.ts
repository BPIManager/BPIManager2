import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import crypto from "crypto";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case "GET": {
        const record = await db
          .selectFrom("apiKeys")
          .select("key")
          .where("userId", "=", req.authUid)
          .executeTakeFirst();

        return res.status(200).json({
          exists: !!record,
          key: record ? `****${record.key.slice(-4)}` : null,
        });
      }

      case "PUT": {
        const newKey = crypto.randomBytes(32).toString("hex");

        await db
          .insertInto("apiKeys")
          .values({
            userId: req.authUid,
            key: newKey,
            createdAt: new Date(),
          })
          .onDuplicateKeyUpdate({
            key: newKey,
          })
          .execute();

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
