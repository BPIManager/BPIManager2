import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

const TARGET_VERSIONS = ["33", "32", "31", "30", "29", "28", "27", "26"];

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
          console.log(snap.data());
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
