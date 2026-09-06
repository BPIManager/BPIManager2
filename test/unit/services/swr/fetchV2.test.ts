import { describe, it, expect, vi, afterEach } from "vitest";
import { fetcherV2, unwrapApiResponse } from "@/services/swr/fetchV2";

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

function brokenJsonResponse(init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => {
      throw new Error("Unexpected token");
    },
  } as unknown as Response;
}

describe("unwrapApiResponse", () => {
  it("正常なエンベロープから body を取り出す", async () => {
    const res = jsonResponse({ error: false, errorMessage: null, body: { x: 1 } });
    await expect(unwrapApiResponse(res)).resolves.toEqual({ x: 1 });
  });

  it("error: true のとき errorMessage 付きで throw する", async () => {
    const res = jsonResponse({
      error: true,
      errorMessage: "forbidden",
      body: null,
    });
    await expect(unwrapApiResponse(res)).rejects.toMatchObject({
      message: "forbidden",
      status: 200,
      info: { error: true, errorMessage: "forbidden", body: null },
    });
  });

  it("HTTP エラー時は status 付きで throw する", async () => {
    const res = jsonResponse(
      { error: true, errorMessage: "server error", body: null },
      { ok: false, status: 500 },
    );
    await expect(unwrapApiResponse(res)).rejects.toMatchObject({
      message: "server error",
      status: 500,
    });
  });

  it("エンベロープ形式でない body は throw する", async () => {
    const res = jsonResponse({ some: "raw shape" });
    await expect(unwrapApiResponse(res)).rejects.toMatchObject({
      message: "An error occurred while fetching the data.",
      status: 200,
    });
  });

  it("JSON パースに失敗しても throw する（info は空オブジェクト）", async () => {
    const res = brokenJsonResponse({ ok: false, status: 502 });
    await expect(unwrapApiResponse(res)).rejects.toMatchObject({
      status: 502,
      info: {},
    });
  });
});

describe("fetcherV2", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("文字列 URL で fetch し body を返す（Authorization ヘッダーなし）", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: false, errorMessage: null, body: [1, 2, 3] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetcherV2("/api/v2/x")).resolves.toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith("/api/v2/x", { headers: {} });
  });

  it("[url, user] 形式なら Authorization ヘッダーを付ける", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: false, errorMessage: null, body: { ok: 1 } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = { getIdToken: vi.fn(async () => "tok-123") };

    await fetcherV2(["/api/v2/y", user]);

    expect(user.getIdToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/v2/y", {
      headers: { Authorization: "Bearer tok-123" },
    });
  });

  it("error: true のエンベロープなら throw する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { error: true, errorMessage: "nope", body: null },
          { ok: false, status: 403 },
        ),
      ),
    );

    await expect(fetcherV2("/api/v2/z")).rejects.toMatchObject({
      message: "nope",
      status: 403,
    });
  });
});
