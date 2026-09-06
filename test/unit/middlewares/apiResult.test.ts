import { describe, it, expect } from "vitest";
import type { NextApiResponse } from "next";
import {
  ok,
  err,
  buildMeta,
  withMeta,
  writeV1Result,
  writeV2Result,
} from "@/middlewares/api/apiResult";

function createMockRes() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

describe("ok / err", () => {
  it("ok は body のみの成功結果を返す", () => {
    expect(ok({ a: 1 })).toEqual({ ok: true, body: { a: 1 } });
  });

  it("ok は meta 付きの成功結果を返す", () => {
    expect(ok([1, 2], { viewerId: "u1", isSelf: true })).toEqual({
      ok: true,
      body: [1, 2],
      meta: { viewerId: "u1", isSelf: true },
    });
  });

  it("err は status と message を持つエラー結果を返す", () => {
    expect(err(404, "not found")).toEqual({
      ok: false,
      status: 404,
      message: "not found",
    });
  });
});

describe("buildMeta", () => {
  it("viewerId が null なら isSelf は false", () => {
    expect(buildMeta(null, "target")).toEqual({
      viewerId: null,
      isSelf: false,
    });
  });

  it("viewerId が対象 userId と一致すれば isSelf は true", () => {
    expect(buildMeta("target", "target")).toEqual({
      viewerId: "target",
      isSelf: true,
    });
  });

  it("viewerId が対象 userId と不一致なら isSelf は false", () => {
    expect(buildMeta("someone", "target")).toEqual({
      viewerId: "someone",
      isSelf: false,
    });
  });

  it("extra で pagination を合成できる", () => {
    expect(
      buildMeta("u1", "u1", {
        pagination: { total: 100, page: 2, perPage: 20, hasNext: true },
      }),
    ).toEqual({
      viewerId: "u1",
      isSelf: true,
      pagination: { total: 100, page: 2, perPage: 20, hasNext: true },
    });
  });
});

describe("withMeta", () => {
  it("成功結果に meta を合成する", () => {
    expect(withMeta(ok({ a: 1 }), { viewerId: "u1", isSelf: true })).toEqual({
      ok: true,
      body: { a: 1 },
      meta: { viewerId: "u1", isSelf: true },
    });
  });

  it("既存の meta にマージする", () => {
    expect(
      withMeta(
        ok([], { pagination: { total: 3, page: 0, perPage: 20, hasNext: false } }),
        { viewerId: "u1", isSelf: false },
      ),
    ).toEqual({
      ok: true,
      body: [],
      meta: {
        viewerId: "u1",
        isSelf: false,
        pagination: { total: 3, page: 0, perPage: 20, hasNext: false },
      },
    });
  });

  it("エラー結果はそのまま返す", () => {
    const e = err(403, "no");
    expect(withMeta(e, { viewerId: "u1", isSelf: true })).toBe(e);
  });
});

describe("writeV1Result", () => {
  it("成功時は 200 で body を生形状のまま書き込む", () => {
    const res = createMockRes();
    writeV1Result(res as unknown as NextApiResponse, ok([1, 2, 3]));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([1, 2, 3]);
  });

  it("成功時は transform で body を整形してから書き込む", () => {
    const res = createMockRes();
    writeV1Result(
      res as unknown as NextApiResponse,
      ok({ count: 2 }),
      (b) => b.count,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(2);
  });

  it("エラー時は status と { message } を書き込む", () => {
    const res = createMockRes();
    writeV1Result(res as unknown as NextApiResponse, err(403, "forbidden"));
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: "forbidden" });
  });
});

describe("writeV2Result", () => {
  it("成功時は 200 でエンベロープ形式（meta なし）を書き込む", () => {
    const res = createMockRes();
    writeV2Result(res as unknown as NextApiResponse, ok({ score: 1234 }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      error: false,
      errorMessage: null,
      body: { score: 1234 },
    });
  });

  it("成功時に meta を渡すと欠けたフィールドを既定値で補完する", () => {
    const res = createMockRes();
    writeV2Result(
      res as unknown as NextApiResponse,
      ok([1], { pagination: { total: 1, page: 1, perPage: 20, hasNext: false } }),
    );
    expect(res.body).toEqual({
      error: false,
      errorMessage: null,
      body: [1],
      meta: {
        viewerId: null,
        isSelf: false,
        pagination: { total: 1, page: 1, perPage: 20, hasNext: false },
      },
    });
  });

  it("成功時に完全な meta を渡すとそのまま載る", () => {
    const res = createMockRes();
    writeV2Result(
      res as unknown as NextApiResponse,
      ok(null, buildMeta("u1", "u1")),
    );
    expect(res.body).toEqual({
      error: false,
      errorMessage: null,
      body: null,
      meta: { viewerId: "u1", isSelf: true },
    });
  });

  it("エラー時は status とエンベロープ形式（body: null, error: true）を書き込む", () => {
    const res = createMockRes();
    writeV2Result(res as unknown as NextApiResponse, err(500, "boom"));
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: true,
      errorMessage: "boom",
      body: null,
    });
  });
});
