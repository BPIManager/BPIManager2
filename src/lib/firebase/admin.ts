import * as admin from "firebase-admin";
import adminsdk from "@/constants/adminsdk.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(adminsdk as admin.ServiceAccount),
    projectId: adminsdk.project_id,
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
