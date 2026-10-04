import { describe, it, expect, beforeAll } from "vitest";
import "dotenv/config";
import dayjs from "@/lib/dayjs";
import { db } from "@/lib/db";
import { userStatusLogsReadRepo } from "@/lib/db/domains/userStatusLogs/read";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { dashboardSchema } from "@/lib/mcp/schemas";
import { registerGetMyDashboard } from "@/lib/mcp/tools/getMyDashboard";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const USER_ID = process.env.TEST_PUBLIC_USER_ID || process.env.TEST_USER_ID || "";
const VERSION = latestVersion;

/** devサーバーが起動していない場合はスイート全体を skip する */
const SERVER_UP = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) })
  .then(() => true)
  .catch(() => false);
/** 対象ユーザー・DB・devサーバーが揃っていない場合はスイート全体を skip する */
const CAN_RUN = !!USER_ID && !!process.env.DB_HOST && SERVER_UP;

type DashboardHandler = (
  input: unknown,
) => Promise<{ content: { type: string; text: string }[] }>;

/**
 * 総合BPIを算出する複数のロジック（dashboard API・monthly-review API・MCPツール）が、
 * 同じ断面（=テスト実行時点の最新状態）で、DB記録済みの値を下回らないことを検証する
 * 統合テスト。
 *
 * 正とするのは`userStatusLogs`にDB記録済みの値そのもの
 * （`BpiCalculator.ratchetTotalBpi`の基準値であり、各ロジックが最終的にこの値を
 * 下回ってはならないことを期待する）。各ロジックは実装上は別々に
 * `calculateTotalBPI`を再計算しているため、ラチェット処理の実装漏れがあると
 * ここで発見できる（実際に過去、MCPの`get_my_dashboard`とmonthly-reviewの
 * `compareVersion`経路でラチェットが適用されていない不具合があった）。
 *
 * 厳密な一致(`toBe`)ではなく下限比較(`toBeGreaterThanOrEqual`)にしているのは、
 * 各ロジックが`ratchetTotalBpi(記録済み最高値, 再計算値)`で「大きい方」を返す
 * 実装である以上、再計算値が記録済み最高値を上回る瞬間は正しい挙動として一致
 * しなくなるため（この場合も含め「下回ることはない」という保証だけを検証する）。
 *
 * テスト対象ユーザー（`TEST_PUBLIC_USER_ID`）が`latestVersion`で実際にプレイ済みで
 * あることが前提。テスト実行中に対象ユーザーが新たにスコアを更新すると
 * 記録済み最高値が変動し失敗することがある（README記載の通りintegrationテストの
 * 特性として許容する）。
 */
describe.skipIf(!CAN_RUN)("総合BPI算出ロジックの一貫性", () => {
  let groundTruth: number | null = null;

  beforeAll(async () => {
    if (!USER_ID) return;
    groundTruth = await userStatusLogsReadRepo.getMaxTotalBpi(db, USER_ID, VERSION);
  });

  it("前提: テスト対象ユーザーにDB記録済みの総合BPIが存在する", () => {
    expect(USER_ID, "TEST_PUBLIC_USER_ID(またはTEST_USER_ID)が未設定").not.toBe("");
    expect(
      groundTruth,
      `userId=${USER_ID}, version=${VERSION}のuserStatusLogsが見つからない`,
    ).not.toBeNull();
  });

  it("GET /stats/totalBpi(asOf=latest) がDB記録済みの最高値を下回らない", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v2/users/${USER_ID}/stats/totalBpi?version=${VERSION}`,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.body.totalBpi).toBeGreaterThanOrEqual(groundTruth as number);
  });

  it("GET /stats/monthly-review/bpi(month=all) のendがDB記録済みの最高値を下回らない", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v2/users/${USER_ID}/stats/monthly-review/bpi?version=${VERSION}&month=all`,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.body.end).toBeGreaterThanOrEqual(groundTruth as number);
  });

  it("MCPツール get_my_dashboard のtotalBpiがDB記録済みの最高値を下回らない", async () => {
    let capturedHandler: DashboardHandler | null = null;
    const fakeServer = {
      registerTool: (
        _name: string,
        _config: unknown,
        handler: DashboardHandler,
      ) => {
        capturedHandler = handler;
      },
    } as unknown as McpServer;

    registerGetMyDashboard(fakeServer, USER_ID);
    expect(capturedHandler).not.toBeNull();

    const input = dashboardSchema.parse({ version: VERSION });
    const result = await capturedHandler!(input);
    const payload = JSON.parse(result.content[1].text);

    expect(payload.totalBpi).toBeGreaterThanOrEqual(groundTruth as number);
  });
});

/**
 * 「現在」だけでなく、過去の全ての日付断面でも各ロジックが記録済みの値を下回らない
 * ことを検証する。`userStatusLogs`に実際に記録された日(=何らかの理由で記録済み
 * 最高値が更新された日)を基準点(チェックポイント)として、その日までの累積最高値
 * (=ground truth)を日毎に算出し、各ロジックの同じ日付に対する出力と比較する。
 *
 * 対象ロジック:
 * - GET /stats/totalBpi?asOf=<date>（過去日との比較機能が使う過去断面の算出）
 * - GET /stats/totalBPIhistory（dashboardの日別総合BPI推移グラフ）
 * - GET /stats/monthly-review/bpi?month=<date月>（月間振り返りの日別推移）
 */
describe.skipIf(!CAN_RUN)("総合BPI算出ロジックの一貫性（全日付断面）", () => {
  let checkpoints: { date: string; groundTruth: number }[] = [];

  beforeAll(async () => {
    if (!USER_ID) return;
    const rows = await db
      .selectFrom("userStatusLogs")
      .select(["createdAt", "totalBpi"])
      .where("userId", "=", USER_ID)
      .where("version", "=", VERSION)
      .orderBy("id", "asc")
      .execute();

    const maxByDate = new Map<string, number>();
    for (const r of rows) {
      const dateStr = dayjs(r.createdAt).tz().format("YYYY-MM-DD");
      const val = Number(r.totalBpi);
      const existing = maxByDate.get(dateStr);
      if (existing === undefined || val > existing) maxByDate.set(dateStr, val);
    }

    let running: number | null = null;
    checkpoints = Array.from(maxByDate.keys())
      .sort()
      .map((date) => {
        const val = maxByDate.get(date)!;
        running = running === null ? val : Math.max(running, val);
        return { date, groundTruth: running as number };
      });
  });

  it("前提: DB記録済みのチェックポイントが1件以上存在する", () => {
    expect(USER_ID, "TEST_PUBLIC_USER_ID(またはTEST_USER_ID)が未設定").not.toBe("");
    expect(checkpoints.length, `userId=${USER_ID}, version=${VERSION}`).toBeGreaterThan(
      0,
    );
  });

  it("GET /stats/totalBpi(asOf=各チェックポイント) が記録済みの値を下回らない", async () => {
    for (const { date, groundTruth } of checkpoints) {
      const res = await fetch(
        `${BASE_URL}/api/v2/users/${USER_ID}/stats/totalBpi?version=${VERSION}&asOf=${date}`,
      );
      const data = await res.json();
      expect(data.body.totalBpi, `asOf=${date}`).toBeGreaterThanOrEqual(groundTruth);
    }
  });

  it("GET /stats/totalBPIhistory(level=12) の各チェックポイント日のtotalBpiが記録済みの値を下回らない", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v2/users/${USER_ID}/stats/totalBPIhistory?version=${VERSION}&level=12`,
    );
    const data = await res.json();
    const byDate = new Map<string, number>(
      data.body.map((r: { date: string; totalBpi: number }) => [r.date, r.totalBpi]),
    );
    for (const { date, groundTruth } of checkpoints) {
      expect(byDate.get(date), `date=${date}`).toBeGreaterThanOrEqual(groundTruth);
    }
  });

  it("GET /stats/monthly-review/bpi(month=該当月) の各チェックポイント日のhistory値が記録済みの値を下回らない", async () => {
    const cache = new Map<string, { date: string; value: number }[]>();
    for (const { date, groundTruth } of checkpoints) {
      const month = date.slice(0, 7);
      if (!cache.has(month)) {
        const res = await fetch(
          `${BASE_URL}/api/v2/users/${USER_ID}/stats/monthly-review/bpi?version=${VERSION}&month=${month}`,
        );
        const data = await res.json();
        cache.set(month, data.body.history);
      }
      const history = cache.get(month)!;
      const entry = history.find((h) => h.date === date);
      expect(entry, `date=${date}のhistoryエントリ`).toBeDefined();
      expect(entry!.value, `date=${date}`).toBeGreaterThanOrEqual(groundTruth);
    }
  });
});
