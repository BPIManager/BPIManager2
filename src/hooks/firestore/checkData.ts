import { IIDX_VERSIONS } from "@/constants/latestVersion";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

const TARGET_VERSIONS = IIDX_VERSIONS;

/**
 * Firestore 上の各 IIDX バージョンにデータが存在するか確認するフック。
 *
 * @param uid - Firebase UID（未定義の場合は何もしない）
 * @returns チェック実行関数・データが存在するバージョン一覧・チェック中フラグ
 */
export const useFirestoreDataCheck = (uid: string | undefined) => {
  const [foundVersions, setFoundVersions] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkData = async () => {
    if (!uid) return;
    setIsChecking(true);
    const found: string[] = [];

    try {
      await Promise.all(
        TARGET_VERSIONS.map(async (v) => {
          const docRef = doc(db, `${v}_1`, uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            found.push(v);
          }
        }),
      );
      setFoundVersions(found.sort((a, b) => (a < b ? 1 : -1)));
    } catch (e) {
      console.error("Firestore check error:", e);
    } finally {
      setIsChecking(false);
    }
  };

  return { checkData, foundVersions, isChecking };
};
