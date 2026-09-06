import { describe, it, expect, beforeAll } from "vitest";
import "dotenv/config";

/**
 * API v2 移行の回帰テスト。
 *
 * 移行済みの各 GET エンドポイントについて `/api/v1/...` と `/api/v2/...` を
 * 同一パラメータ・同一認証で叩き、
 *   - v2 が共通エンベロープ形式（{ error:false, errorMessage:null, body, meta? }）であること
 *   - `v2.body` が v1 の生レスポンスと一致すること（＝移行でロジック不変）
 *   - HTTP ステータスが一致すること
 * を検証する。手動でのページ確認を置き換えるのが目的。
 *
 * 前提（`.env` / 環境変数）:
 *   TEST_API_KEY        : /api/v1/token に渡す API キー（認証ユーザー = そのキーの所有者）
 *   NEXT_PUBLIC_FIREBASE_API_KEY : Custom Token → ID Token 交換用
 *   TEST_BASE_URL       : 省略時 http://localhost:3000（`pnpm dev` を起動しておく）
 *   TEST_PUBLIC_USER_ID : 公開プロフィールのユーザー ID（クロスユーザー参照の検証用）
 *   TEST_PRIVATE_USER_ID: 非公開プロフィールのユーザー ID
 *   TEST_SONG_ID        : 存在する楽曲 ID（曲別ランキング等の検証用、省略時 1000）
 *
 * これらが揃っていない場合はスイート全体を skip する。
 */

const API_KEY = process.env.TEST_API_KEY;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const PUBLIC_USER_ID = process.env.TEST_PUBLIC_USER_ID || "";
const PRIVATE_USER_ID = process.env.TEST_PRIVATE_USER_ID || "";
const SONG_ID = process.env.TEST_SONG_ID || "1000";

const CAN_RUN = !!API_KEY && !!FIREBASE_API_KEY;

/** マスク等で毎回変わる値を吸収してから比較する */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      // 非公開ユーザーは v1/v2 でそれぞれ uuidv4() が振られ一致しないため潰す
      if (k === "userId" && obj.userName === "非公開ユーザー") {
        out[k] = "<masked>";
        continue;
      }
      out[k] = normalize(v);
    }
    return out;
  }
  return value;
}

async function getIdToken(): Promise<string> {
  const tokenRes = await fetch(`${BASE_URL}/api/v1/token`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY as string, "Content-Type": "application/json" },
  });
  const { customToken } = await tokenRes.json();

  const exchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const { idToken } = await exchangeRes.json();
  return idToken;
}

let ID_TOKEN = "";
let SELF_ID = "";

beforeAll(async () => {
  if (!CAN_RUN) return;
  ID_TOKEN = await getIdToken();
  const meRes = await fetch(`${BASE_URL}/api/v1/me?uid=`, {
    headers: { Authorization: `Bearer ${ID_TOKEN}` },
  });
  const me = await meRes.json();
  SELF_ID = me?.user?.userId ?? "";
});

async function call(pathWithQuery: string, authed: boolean) {
  const res = await fetch(`${BASE_URL}${pathWithQuery}`, {
    headers: authed ? { Authorization: `Bearer ${ID_TOKEN}` } : {},
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

/**
 * 検証対象。`path` は `/users/:self/...` のように `:self` / `:pub` / `:priv` /
 * `:song` を含められる（実行時に置換）。移行が進んだらここに行を足す。
 */
type Row = { name: string; v1: string; v2: string; authed: boolean; userScoped: boolean };

const ROWS: Row[] = [
  // notifications (#326)
  { name: "notifications list", v1: "/api/v1/users/:self/notifications?type=all&page=0&limit=20", v2: "/api/v2/users/:self/notifications?type=all&page=0&limit=20", authed: true, userScoped: true },
  { name: "notifications count", v1: "/api/v1/users/:self/notifications/count", v2: "/api/v2/users/:self/notifications/count", authed: true, userScoped: true },
  // all-scores (#319)
  { name: "all-scores list", v1: "/api/v1/users/:self/all-scores/list", v2: "/api/v2/users/:self/all-scores/list", authed: true, userScoped: true },
  { name: "all-scores history", v1: "/api/v1/users/:self/all-scores/:song/history", v2: "/api/v2/users/:self/all-scores/:song/history", authed: true, userScoped: true },
  { name: "all-scores ranking", v1: "/api/v1/users/:self/all-scores/:song/ranking", v2: "/api/v2/users/:self/all-scores/:song/ranking", authed: true, userScoped: true },
  { name: "all-scores rivals", v1: "/api/v1/users/:self/all-scores/:song/rivals", v2: "/api/v2/users/:self/all-scores/:song/rivals", authed: true, userScoped: true },
  // ranking (#324)
  { name: "ranking global", v1: "/api/v1/users/:self/ranking/global?category=totalBpi", v2: "/api/v2/users/:self/ranking/global?category=totalBpi", authed: true, userScoped: true },
  { name: "ranking song", v1: "/api/v1/users/:self/ranking/song/:song", v2: "/api/v2/users/:self/ranking/song/:song", authed: true, userScoped: true },
  { name: "ranking songs", v1: "/api/v1/users/:self/ranking/songs", v2: "/api/v2/users/:self/ranking/songs", authed: true, userScoped: true },
  { name: "ranking tower", v1: "/api/v1/users/:self/ranking/tower?period=day", v2: "/api/v2/users/:self/ranking/tower?period=day", authed: true, userScoped: true },
  // user songs (#327)
  { name: "user songs list", v1: "/api/v1/users/:self/songs", v2: "/api/v2/users/:self/songs", authed: true, userScoped: true },
  // site / supporters (#330)
  { name: "site stats", v1: "/api/v1/site/stats", v2: "/api/v2/site/stats", authed: false, userScoped: false },
  { name: "site songs popular", v1: "/api/v1/site/songs/popular?order=top&offset=0&limit=10", v2: "/api/v2/site/songs/popular?order=top&offset=0&limit=10", authed: false, userScoped: false },
  { name: "site arena official", v1: "/api/v1/site/arena/official", v2: "/api/v2/site/arena/official", authed: false, userScoped: false },
  { name: "supporters", v1: "/api/v1/supporters", v2: "/api/v2/supporters", authed: false, userScoped: false },
  // profile / me (#321)
  { name: "profile (public, cross-user)", v1: "/api/v1/users/:pub/profile", v2: "/api/v2/users/:pub/profile", authed: true, userScoped: true },
  { name: "profile compare (self)", v1: "/api/v1/users/:self/profile?compare=true", v2: "/api/v2/users/:self/profile?compare=true", authed: true, userScoped: true },
  { name: "me", v1: "/api/v1/me?uid=", v2: "/api/v2/me?uid=", authed: true, userScoped: true },
];

function resolve(p: string): string {
  return p
    .replace(":self", SELF_ID)
    .replace(":pub", PUBLIC_USER_ID)
    .replace(":priv", PRIVATE_USER_ID)
    .replace(":song", SONG_ID);
}

describe.skipIf(!CAN_RUN)("API v1 <-> v2 parity", () => {
  it.each(ROWS)("$name : v2 body は v1 と一致し、エンベロープ形式である", async (row) => {
    if (row.v1.includes(":pub") && !PUBLIC_USER_ID) return;
    if (row.v1.includes(":priv") && !PRIVATE_USER_ID) return;

    const v1 = await call(resolve(row.v1), row.authed);
    const v2 = await call(resolve(row.v2), row.authed);

    expect(v2.status).toBe(v1.status);

    // エンベロープ構造
    expect(v2.json).toMatchObject({
      error: expect.any(Boolean),
      errorMessage: v1.status < 400 ? null : expect.any(String),
    });
    expect(v2.json).toHaveProperty("body");

    if (v1.status < 400) {
      expect(v2.json.error).toBe(false);
      expect(normalize(v2.json.body)).toEqual(normalize(v1.json));
      if (row.userScoped) {
        expect(v2.json.meta).toBeDefined();
        expect(v2.json.meta).toHaveProperty("viewerId");
        expect(v2.json.meta).toHaveProperty("isSelf");
      }
    } else {
      expect(v2.json.error).toBe(true);
      expect(v2.json.body).toBeNull();
    }
  });
});
