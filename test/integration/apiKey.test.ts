import { describe, it, expect } from "vitest";
import "dotenv/config";

const API_KEY = process.env.TEST_API_KEY || "your_test_api_key";
const USER_ID = process.env.TEST_USER_ID || "your_test_user_id";
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

describe("API Token Exchange Flow", () => {
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
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
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
