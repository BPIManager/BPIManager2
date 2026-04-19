import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebase/admin";
import { apiKeysRepo } from "@/lib/db/apiKeys";
import { timingSafeEqual } from "@/utils/common/timingSafeEqual";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const xApiKey = req.headers["x-api-key"];

  if (!xApiKey || typeof xApiKey !== "string") {
    return res.status(401).json({ message: "API Key is required" });
  }

  try {
    const keyRecord = await apiKeysRepo.findByKey(xApiKey);

    if (!keyRecord || !timingSafeEqual(xApiKey, keyRecord.key)) {
      return res.status(401).json({ message: "Invalid API Key" });
    }

    const customToken = await adminAuth.createCustomToken(keyRecord.userId);

    return res.status(200).json({
      customToken,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Token Exchange Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
