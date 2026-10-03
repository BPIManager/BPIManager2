import { describe, it, expect, beforeAll } from "vitest";
import "dotenv/config";
import { db } from "@/lib/db";
import { userStatusLogsRepo } from "@/lib/db/domains/userStatusLogs";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { dashboardSchema } from "@/lib/mcp/schemas";
import { registerGetMyDashboard } from "@/lib/mcp/tools/getMyDashboard";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const USER_ID = process.env.TEST_PUBLIC_USER_ID || process.env.TEST_USER_ID || "";
const VERSION = latestVersion;

type DashboardHandler = (
  input: unknown,
) => Promise<{ content: { type: string; text: string }[] }>;

/**
 * 総合BPIを算出する複数のロジック（dashboard API・monthly-review API・MCPツール）が、
 * 同じ断面（=テスト実行時点の最新状態）に対して同じ値を算出することを検証する統合テスト。
 *
 * 正とするのは`userStatusLogs`にDB記録済みの値そのもの
 * （`BpiCalculator.ratchetTotalBpi`の基準値であり、各ロジックが最終的にこの値に
 * 揃うことを期待する）。各ロジックは実装上は別々に`calculateTotalBPI`を再計算して
 * いるため、ラチェット処理の実装漏れがあるとここで発見できる
 * （実際に過去、MCPの`get_my_dashboard`とmonthly-reviewの`compareVersion`経路で
 * ラチェットが適用されていない不具合があった）。
 *
 * テスト対象ユーザー（`TEST_PUBLIC_USER_ID`）が`latestVersion`で実際にプレイ済みで
 * あることが前提。テスト実行中に対象ユーザーが新たにスコアを更新すると
 * 記録済み最高値が変動し失敗することがある（README記載の通りintegrationテストの
 * 特性として許容する）。
 */
describe("総合BPI算出ロジックの一貫性", () => {
  let groundTruth: number | null = null;

  beforeAll(async () => {
    if (!USER_ID) return;
    groundTruth = await userStatusLogsRepo.getMaxTotalBpi(db, USER_ID, VERSION);
  });

  it("前提: テスト対象ユーザーにDB記録済みの総合BPIが存在する", () => {
    expect(USER_ID, "TEST_PUBLIC_USER_ID(またはTEST_USER_ID)が未設定").not.toBe("");
    expect(
      groundTruth,
      `userId=${USER_ID}, version=${VERSION}のuserStatusLogsが見つからない`,
    ).not.toBeNull();
  });

  it("GET /stats/totalBpi(asOf=latest) がDB記録済みの最高値と一致する", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v2/users/${USER_ID}/stats/totalBpi?version=${VERSION}`,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.body.totalBpi).toBe(groundTruth);
  });

  it("GET /stats/monthly-review/bpi(month=all) のendがDB記録済みの最高値と一致する", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v2/users/${USER_ID}/stats/monthly-review/bpi?version=${VERSION}&month=all`,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.body.end).toBe(groundTruth);
  });

  it("MCPツール get_my_dashboard のtotalBpiがDB記録済みの最高値と一致する", async () => {
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

    expect(payload.totalBpi).toBe(groundTruth);
  });
});
