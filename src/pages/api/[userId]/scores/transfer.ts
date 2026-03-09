import type { NextApiRequest, NextApiResponse } from "next";
import { BpiRepository } from "@/lib/db/bpi";
import { adminDb } from "@/lib/firebase/admin";
import { BpiImportService } from "@/lib/transfer/importer";
import { checkUserAccess } from "@/middlewares/api/withApi";
import { IIDX_VERSIONS } from "@/constants/latestVersion";

const VERSIONS = IIDX_VERSIONS;
const SUFFIXES = ["1"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res
      .status(400)
      .json({ error: "User ID is required and must be a string" });
  }

  const repo = new BpiRepository();
  const service = new BpiImportService(repo);

  try {
    const access = await checkUserAccess(req, userId as string);
    if (!access.hasAccess) {
      return res
        .status(access.error!.status)
        .json({ message: access.error!.message });
    }

    const allDataToImport: { version: string; data: any }[] = [];

    for (const v of VERSIONS) {
      for (const s of SUFFIXES) {
        const collectionName = `${v}_${s}`;
        const docRef = adminDb.collection(collectionName).doc(userId);
        const snap = await docRef.get();

        if (snap.exists && snap.data()?.scoresHistory?.length > 0) {
          allDataToImport.push({ version: v, data: snap.data() });
          break;
        }
      }
    }

    if (allDataToImport.length === 0) {
      return res
        .status(404)
        .json({ message: "No importable data found in Firestore." });
    }

    const result = await service.saveMultipleFirestoreData(
      userId,
      allDataToImport,
    );

    return res.status(200).json({
      message: "Transfer successful",
      importedVersions: allDataToImport.map((d) => d.version),
      totalProcessed: result.totalProcessed,
    });
  } catch (error: any) {
    console.error("Transfer API Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
