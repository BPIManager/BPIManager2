import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

import { getFunctions, httpsCallable as H } from "firebase/functions";
import { GoogleAuthProvider, TwitterAuthProvider } from "firebase/auth";
import { getAuth } from "firebase/auth";
import "firebase/functions";
import { getFirestore } from "firebase/firestore";

/** Firebase アプリインスタンス（クライアントサイド共通） */
export const fb = initializeApp({
  apiKey: "AIzaSyAIlzzxI0kZtIe4vvjSIiRwfqSQVZtbluM",
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

/**
 * Firebase Cloud Functions の HTTPS Callable 関数を呼び出す。
 *
 * @param _cat - カテゴリ（未使用、将来の拡張用）
 * @param endpoint - 呼び出す関数のエンドポイント名
 * @param data - 関数に渡すデータ
 * @returns 関数の実行結果を含む Promise
 */
export const httpsCallable = (_cat: string, endpoint: string, data: unknown) => {
  return H(f, endpoint)(data);
};

/**
 * Firebase Cloud Functions の HTTP エンドポイントに GET リクエストを送信する。
 *
 * @param endpoint - 呼び出す関数のエンドポイント名
 * @param query - クエリ文字列（例: `"foo=bar&baz=1"`）
 * @returns レスポンス JSON、失敗時は `null`
 */
export const httpsCfGet = async (endpoint: string, query?: string) => {
  const q = query ? "?" + query : "";
  return (
    await fetch(
      `https://asia-northeast1-bpimv2.cloudfunctions.net/${endpoint}${q}`,
    )
  )
    .json()
    .then((t) => {
      return t;
    })
    .catch((e) => {
      console.log(e);
      return null;
    });
};
