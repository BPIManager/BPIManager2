import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { BpiImportService } from "@/lib/transfer/importer";
import { adminDb } from "@/lib/firebase/admin";
import { toErrorMessage } from "@/lib/subhandlers/shared";
import { err, ok } from "@/middlewares/api/apiResult";
import { type HandleOutcome } from "./_shared";
import type { AuthenticatedNextApiRequest } from "@/middlewares/api/withAuth";
import type { BpimScoreData } from "@/types/transfer";

export async function handleScoresTransfer(
  req: AuthenticatedNextApiRequest,
): Promise<HandleOutcome<unknown>> {
  const viewerId = req.authUid;
  const base = { targetUserId: viewerId, viewerId };

  const service = new BpiImportService();

  try {
    const authUid = viewerId;
    const allDataToImport: { version: string; data: BpimScoreData }[] = [];

    for (const v of IIDX_VERSIONS) {
      for (const s of ["1"]) {
        const collectionName = `${v}_${s}`;
        const docRef = adminDb.collection(collectionName).doc(authUid);
        const snap = await docRef.get();

        if (snap.exists && snap.data()?.scoresHistory?.length > 0) {
          allDataToImport.push({
            version: v,
            data: snap.data() as BpimScoreData,
          });
          break;
        }
      }
    }

    if (allDataToImport.length === 0) {
      return {
        result: err(404, "No importable data found in Firestore."),
        ...base,
      };
    }

    const result = await service.saveMultipleFirestoreData(
      authUid,
      allDataToImport,
    );

    return {
      result: ok({
        message: "Transfer successful",
        importedVersions: allDataToImport.map((d) => d.version),
        totalProcessed: result.totalProcessed,
      }),
      ...base,
    };
  } catch (error: unknown) {
    return { result: err(500, toErrorMessage(error)), ...base };
  }
}
