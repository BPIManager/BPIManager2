import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

/**
 * Firebase Admin Authentication インスタンス。
 * API Route でのIDトークン検証やユーザー管理に使用する。
 */
export const adminAuth = admin.auth();

/**
 * Firebase Admin Firestore インスタンス。
 * サーバーサイドからの Firestore 操作に使用する。
 */
export const adminDb = admin.firestore();
