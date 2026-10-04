import { describe, it, expect } from "vitest";
import "dotenv/config";

import { FIREBASE_WEB_API_KEY } from "@/constants/firebase/webApiKey";

/**
 * 前提（`.env` / 環境変数）: TEST_API_KEY（APIキー）・TEST_USER_ID（その所有者）・devサーバー起動（TEST_BASE_URL、省略時 http://localhost:3000）。
 * TEST_API_KEY / TEST_USER_ID が無い、またはdevサーバーに接続できない場合はスイート全体を skip する。
 */
const API_KEY = process.env.TEST_API_KEY || "";
const USER_ID = process.env.TEST_USER_ID || "";
const BASE_URL = (process.env.TEST_BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/** devサーバーが起動していない場合はスイート全体を skip する */
const SERVER_UP = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
  .then(() => true)
  .catch(() => false);
const CAN_RUN = !!API_KEY && !!USER_ID && SERVER_UP;

describe.skipIf(!CAN_RUN)("API Token Exchange Flow", () => {
  let customToken: string;
  let idToken: string;

  it("Step 1: X-API-Key を Custom Token に交換できること", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/token`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("customToken");
    expect(typeof data.customToken).toBe("string");

    customToken = data.customToken;
  });

  it("Step 2: Custom Token を Firebase ID Token に交換できること", async () => {
    expect(customToken).toBeDefined();

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      },
    );

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("idToken");

    idToken = data.idToken;
  });

  it("Step 3: 取得した ID Token で保護された API にアクセスできること", async () => {
    expect(idToken).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/v1/users/${USER_ID}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("profile");
    expect(data.profile.userId).toBe(USER_ID);
  });

  it("APIキー由来のセッションではAPIキー管理エンドポイントが403になること", async () => {
    expect(idToken).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/v1/apiKey`, {
      method: "GET",
      headers: { Authorization: `Bearer ${idToken}` },
    });

    expect(res.status).toBe(403);
  });

  it("不正な API Key の場合に 401 エラーを返すこと", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/token`, {
      method: "POST",
      headers: {
        "X-API-Key": "invalid_key",
        "Content-Type": "application/json",
      },
    });

    expect(res.status).toBe(401);
  });
});
