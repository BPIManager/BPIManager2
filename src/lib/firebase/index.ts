import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

import { getFunctions } from "firebase/functions";
import { GoogleAuthProvider, TwitterAuthProvider } from "firebase/auth";
import { getAuth } from "firebase/auth";
import "firebase/functions";
import { getFirestore } from "firebase/firestore";
import { FIREBASE_WEB_API_KEY } from "@/constants/firebase/webApiKey";

/** Firebase アプリインスタンス（クライアントサイド共通） */
export const fb = initializeApp({
  apiKey: FIREBASE_WEB_API_KEY,
  authDomain: "bpimv2.firebaseapp.com",
  projectId: "bpimv2",
  storageBucket: "bpimv2.appspot.com",
  messagingSenderId: "199747072203",
  appId: "1:199747072203:web:79b7545a4e426763b5ab4e",
  measurementId: "G-4V5QE3YXF9",
});

/** Firestore クライアントインスタンス */
export const db = getFirestore(fb);
/** Firebase Authentication クライアントインスタンス */
export const auth = getAuth();
/** Firebase Storage クライアントインスタンス */
export const storage = getStorage(fb);
/** Twitter (X) OAuth プロバイダー */
export const twitter = new TwitterAuthProvider();
/** Google OAuth プロバイダー */
export const google = new GoogleAuthProvider();
export default fb;

const f = getFunctions(fb, "asia-northeast1");

/** Firebase Cloud Functions インスタンス（asia-northeast1 リージョン） */
export const functions = f;
