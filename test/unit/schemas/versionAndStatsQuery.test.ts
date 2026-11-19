import { describe, expect, it } from "vitest";
import { latestVersion } from "@/constants/iidx/iidxVersions";
import { iidxVersionQuerySchema } from "@/schemas/common/version";
import { statsQuerySchema } from "@/schemas/stats/query";
import { tokenRequestSchema, consentSchema, registerClientSchema } from "@/schemas/oauth";

describe("iidxVersionQuerySchema", () => {
  it("有効値はそのまま、無効値・未指定は最新バージョンにフォールバックする", () => {
    expect(iidxVersionQuerySchema.parse("33")).toBe("33");
    expect(iidxVersionQuerySchema.parse("INF")).toBe("INF");
    expect(iidxVersionQuerySchema.parse("99")).toBe(latestVersion);
    expect(iidxVersionQuerySchema.parse(undefined)).toBe(latestVersion);
  });
});

describe("statsQuerySchema", () => {
  it("level / difficulty は単一値・配列のどちらも受け付ける", () => {
    const r = statsQuerySchema.parse({ userId: "u", level: ["11", "12"], difficulty: "ANOTHER" });
    expect(r.level).toEqual([11, 12]);
    expect(r.difficulty).toEqual(["ANOTHER"]);
  });
  it("未指定は空配列、不正な difficulty は空配列になる", () => {
    const r = statsQuerySchema.parse({ userId: "u", difficulty: ["BOGUS"] });
    expect(r.level).toEqual([]);
    expect(r.difficulty).toEqual([]);
  });
});

describe("oauth スキーマ", () => {
  const verifier = "v".repeat(43);
  it("tokenRequestSchema は client_id なし(Basic 認証)を受け付けるが、危険な redirect_uri は拒否する", () => {
    const base = { grant_type: "authorization_code", code: "c", redirect_uri: "https://a.example/cb", code_verifier: verifier };
    expect(tokenRequestSchema.safeParse(base).success).toBe(true);
    expect(tokenRequestSchema.safeParse({ ...base, redirect_uri: "javascript:alert(1)" }).success).toBe(false);
    expect(tokenRequestSchema.safeParse({ ...base, code_verifier: "short" }).success).toBe(false);
  });
  it("consentSchema は S256 以外を拒否する", () => {
    const base = { client_id: "c", redirect_uri: "https://a.example/cb", code_challenge: "c".repeat(43) };
    expect(consentSchema.safeParse({ ...base, code_challenge_method: "S256" }).success).toBe(true);
    expect(consentSchema.safeParse({ ...base, code_challenge_method: "plain" }).success).toBe(false);
  });
  it("registerClientSchema は redirect_uris の個数と形式を検証する", () => {
    expect(registerClientSchema.safeParse({ redirect_uris: [] }).success).toBe(false);
    expect(registerClientSchema.safeParse({ redirect_uris: ["http://example.com"] }).success).toBe(false);
    expect(registerClientSchema.safeParse({ redirect_uris: ["https://a.example/cb"] }).success).toBe(true);
  });
});
