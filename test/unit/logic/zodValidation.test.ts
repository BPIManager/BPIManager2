import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { invalidParam, parseIntParam, parseStringParam } from "@/lib/validation/params";
import { parseInput } from "@/lib/validation/parse";
import { pathParamsSchema } from "@/schemas/common/params";
import {
  topRankersAreaScoresQuerySchema,
  topRankersListQuerySchema,
  topRankersRankingQuerySchema,
} from "@/schemas/topRankers/query";
import { noteBodySchema, patternCursorQuerySchema, patternVoteBodySchema } from "@/schemas/songs/input";
import { ticketQuerySchema, ticketRecommendBodySchema } from "@/schemas/tickets/input";
import { maxStepsQuerySchema, targetBpiQuerySchema } from "@/schemas/bpiOptimizer/query";
import { monthlyReviewRequiredSchema, monthlyReviewValueSchema } from "@/schemas/rivals/monthlyReviewSummary";
import { emailBodySchema, linkableProviderSchema } from "@/schemas/auth/email";
import { arenaHistoryValueSchema } from "@/schemas/stats/routeQueries";
import { versionQuerySchema } from "@/schemas/common/query";

const ok = (s: Parameters<typeof parseInput>[0], v: unknown) =>
  parseInput(s, v, { in: "query" }).success;

describe("パスパラメータの共通スキーマ", () => {
  it("整数: 正の整数の文字列だけを通す", () => {
    expect(parseIntParam("songId", "12")).toBe(12);
    for (const bad of ["12abc", "1.5", "0", "-1", "", " 7", undefined, ["1", "2"], 12]) {
      expect(parseIntParam("songId", bad)).toBeNull();
    }
  });

  it("文字列: 空でない文字列だけを通す（配列・未指定は不正）", () => {
    expect(parseStringParam("userId", "abc")).toBe("abc");
    for (const bad of ["", undefined, ["a"], 1]) expect(parseStringParam("userId", bad)).toBeNull();
  });

  it("invalidParam: メッセージは従来のまま、errorDetails に原因と受け付ける形を載せる", () => {
    const r = invalidParam("songId", "abc", "Invalid songId");
    expect(r).toMatchObject({ ok: false, status: 400, message: "Invalid songId" });
    const d = (
      r as {
        details: {
          in: string;
          issues: { path: string[]; message: string }[];
          schema: { properties: Record<string, unknown> };
        };
      }
    ).details;
    expect(d.in).toBe("path");
    expect(d.issues[0].path).toEqual(["songId"]);
    expect(d.issues[0].message).toMatch(/positive integer/);
    expect(Object.keys(d.schema.properties)).toEqual(["songId"]);
  });

  it("pathParamsSchema: 複数のパラメータを個々の定義でまとめて検証する", () => {
    const schema = pathParamsSchema("userId", "songId");
    expect(schema.safeParse({ userId: "u", songId: "3" }).data).toEqual({ userId: "u", songId: 3 });
    expect(schema.safeParse({ userId: "u", songId: "x" }).success).toBe(false);
    expect(schema.safeParse({ songId: "3" }).success).toBe(false);
  });
});

describe("クエリ・ボディのスキーマ", () => {
  it("version は空でない文字列", () => {
    expect(ok(versionQuerySchema, { version: "34" })).toBe(true);
    expect(ok(versionQuerySchema, {})).toBe(false);
    expect(ok(versionQuerySchema, { version: "" })).toBe(false);
  });

  it("トップランカー: version は対応バージョン、areaId は範囲内の整数", () => {
    expect(ok(topRankersListQuerySchema, { version: "33" })).toBe(true);
    expect(ok(topRankersListQuerySchema, { version: "1" })).toBe(false);
    expect(ok(topRankersAreaScoresQuerySchema, { version: "33", areaId: "0" })).toBe(true);
    expect(ok(topRankersAreaScoresQuerySchema, { version: "33", areaId: "9999" })).toBe(false);
    expect(ok(topRankersAreaScoresQuerySchema, { version: "33", areaId: "1.5" })).toBe(false);
  });

  it("トップランカーのランキング: area の省略は全国、levels は 1〜12、難易度は既知の値", () => {
    const base = { version: "33" };
    const d = parseInput(
      topRankersRankingQuerySchema,
      { ...base, levels: "11,12", difficulties: "ANOTHER" },
      { in: "query" },
    );
    expect(d.success && d.data).toMatchObject({ area: 0, levels: [11, 12], difficulties: ["ANOTHER"] });
    expect(ok(topRankersRankingQuerySchema, { ...base, levels: "13" })).toBe(false);
    expect(ok(topRankersRankingQuerySchema, { ...base, difficulties: "EASY" })).toBe(false);
    expect(ok(topRankersRankingQuerySchema, base)).toBe(true);
  });

  it("ノート本文: 前後の空白を除いて 1〜2000 文字。メッセージは従来と同じ", () => {
    const msg = (v: unknown) => {
      const r = parseInput(noteBodySchema, v, { in: "body" });
      return r.success ? null : (r.result as { message: string }).message;
    };
    expect(msg({ body: "  hi " })).toBeNull();
    expect(msg({ body: "   " })).toBe("body is required");
    expect(msg({})).toBe("body is required");
    expect(msg({ body: "a".repeat(2001) })).toBe("body too long (max 2000)");
    const r = parseInput(noteBodySchema, { body: "  hi " }, { in: "body" });
    expect(r.success && r.data.body).toBe("hi");
  });

  it("パターン: cursor は未指定・空で 0、負数や数値以外は不正。投票は upvote / downvote", () => {
    const cur = (v: unknown) => {
      const r = parseInput(patternCursorQuerySchema, v, { in: "query" });
      return r.success ? r.data.cursor : null;
    };
    expect(cur({})).toBe(0);
    expect(cur({ cursor: "" })).toBe(0);
    expect(cur({ cursor: "25" })).toBe(25);
    expect(cur({ cursor: "-1" })).toBeNull();
    expect(cur({ cursor: "x" })).toBeNull();
    expect(ok(patternVoteBodySchema, { voteType: "upvote" })).toBe(true);
    expect(ok(patternVoteBodySchema, { voteType: "x" })).toBe(false);
  });

  it("チケット: ticketId は必須、ticketIds は 1〜50 件", () => {
    expect(ok(ticketQuerySchema, { ticketId: "t" })).toBe(true);
    expect(ok(ticketQuerySchema, {})).toBe(false);
    const item = { ticketId: "t", expiresAt: "e" };
    expect(ok(ticketRecommendBodySchema, { ticketIds: [item] })).toBe(true);
    expect(ok(ticketRecommendBodySchema, { ticketIds: [] })).toBe(false);
    expect(ok(ticketRecommendBodySchema, { ticketIds: Array(51).fill(item) })).toBe(false);
  });

  it("オプティマイザ: targetBpi は -15〜100、maxSteps は 1〜400（未指定は 30）", () => {
    expect(ok(targetBpiQuerySchema, { targetBpi: "50.5" })).toBe(true);
    expect(ok(targetBpiQuerySchema, { targetBpi: "101" })).toBe(false);
    expect(ok(targetBpiQuerySchema, { targetBpi: "x" })).toBe(false);
    const steps = parseInput(maxStepsQuerySchema, {}, { in: "query" });
    expect(steps.success && steps.data.maxSteps).toBe(30);
    expect(ok(maxStepsQuerySchema, { maxSteps: "0" })).toBe(false);
    expect(ok(maxStepsQuerySchema, { maxSteps: "401" })).toBe(false);
  });

  it("月間レビュー要約: month は all / YYYY / YYYY-MM、version は対応バージョン", () => {
    expect(ok(monthlyReviewRequiredSchema, { userId: "u", month: "all", version: "34" })).toBe(true);
    expect(ok(monthlyReviewRequiredSchema, { userId: "u", month: "all" })).toBe(false);
    for (const month of ["all", "2026", "2026-11"]) {
      expect(ok(monthlyReviewValueSchema, { month, version: "34" })).toBe(true);
    }
    for (const month of ["2026-1", "11", "x"]) {
      expect(ok(monthlyReviewValueSchema, { month, version: "34" })).toBe(false);
    }
    expect(ok(monthlyReviewValueSchema, { month: "all", version: "1" })).toBe(false);
  });

  it("認証: メールアドレスの形式と、連携解除できるログイン手段", () => {
    expect(ok(emailBodySchema, { email: "a@example.com" })).toBe(true);
    expect(ok(emailBodySchema, { email: "not-an-email" })).toBe(false);
    expect(ok(emailBodySchema, {})).toBe(false);
    expect(ok(linkableProviderSchema, { providerId: "google.com" })).toBe(true);
    expect(ok(linkableProviderSchema, { providerId: "nope" })).toBe(false);
  });

  it("アリーナ履歴: 日付は妥当なものだけ", () => {
    const base = { userId: "u", version: "34" };
    expect(ok(arenaHistoryValueSchema, { ...base, startDate: "2026-01-01", endDate: "2026-02-01" })).toBe(true);
    expect(ok(arenaHistoryValueSchema, { ...base, startDate: "x", endDate: "2026-02-01" })).toBe(false);
  });

  it("エラーの原因（issues）は英語で返る", () => {
    const r = parseInput(noteBodySchema, {}, { in: "body" });
    if (r.success) throw new Error("unreachable");
    const issues = (r.result as { details: { issues: { message: string }[] } }).details.issues;
    for (const i of issues) expect(/[぀-ヿ一-鿿]/.test(i.message)).toBe(false);
  });
});

describe("手書きの 400 を増やさない", () => {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? walk(p) : p.endsWith(".ts") ? [p] : [];
    });

  // 入力の形式ではなく、業務ルールや外部サービスの結果による 400
  const BUSINESS_MESSAGES = [
    "You cannot follow yourself",
    "Not following this user",
    "Unknown saved comparison",
    "最新のバッチのみ削除できます。",
    "ユーザー名が一致しません。入力を確認してください。",
    "EXスコアが理論上の最大値を超えています。",
    "現在の自己ベストを上回っていません。",
    "メールアドレスの形式が正しくありません", // Firebase のエラーの対応づけ（auth/_errors.ts）
    "Invalid parameters", // v1 ルートは詳細を返さない（site/bpiCalc.ts）
  ];

  it("subhandlers の err(400, ...) は、業務ルールのものだけ（入力の検証は zod のスキーマで行う）", () => {
    const root = path.resolve(__dirname, "../../../src/lib/subhandlers");
    const offenders: string[] = [];
    for (const f of walk(root)) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/err\(\s*400,\s*([`"'])((?:(?!\1).)*)\1/g)) {
        const message = m[2];
        if (BUSINESS_MESSAGES.includes(message) || message.startsWith("exScore exceeds maximum")) continue;
        offenders.push(`${path.relative(root, f)}: ${message}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
