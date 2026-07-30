import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import { adminAuth } from "@/lib/firebase/admin";

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

function createMockReqRes(params: {
  authorization?: string;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}) {
  const req = {
    headers: params.authorization
      ? { authorization: params.authorization }
      : {},
    query: params.query ?? {},
    body: params.body ?? {},
  } as unknown as NextApiRequest;

  const res = {
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

  return { req, res };
}

describe("withAuth", () => {
  beforeEach(() => {
    vi.mocked(adminAuth.verifyIdToken).mockReset();
  });

  it("Authorizationヘッダーが無い場合は401を返しハンドラーを呼び出さないこと", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({});

    await wrapped(req, res as never);

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("Bearer形式でないAuthorizationヘッダーは401を返すこと", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({ authorization: "Basic abc123" });

    await wrapped(req, res as never);

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("トークン検証に失敗した場合は401を返しハンドラーを呼び出さないこと", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(
      Object.assign(new Error("expired"), { code: "auth/id-token-expired" }),
    );
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({ authorization: "Bearer bad-token" });

    await wrapped(req, res as never);

    expect(res.statusCode).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("queryのuserIdが認証済みユーザーと一致しない場合は403を返しハンドラーを呼び出さないこと", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "real-caller-uid",
    } as never);
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({
      authorization: "Bearer valid-token",
      query: { userId: "someone-elses-uid" },
    });

    await wrapped(req, res as never);

    expect(res.statusCode).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("bodyのuserIdが認証済みユーザーと一致しない場合は403を返しハンドラーを呼び出さないこと", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "real-caller-uid",
    } as never);
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({
      authorization: "Bearer valid-token",
      body: { userId: "someone-elses-uid" },
    });

    await wrapped(req, res as never);

    expect(res.statusCode).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("queryのuserIdが認証済みユーザーと一致する場合はauthUidを付与してハンドラーを呼び出すこと", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "matching-uid",
    } as never);
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ authUid: req.authUid });
    });
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({
      authorization: "Bearer valid-token",
      query: { userId: "matching-uid" },
    });

    await wrapped(req, res as never);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ authUid: "matching-uid" });
  });

  it("userIdパラメータが無いルートでは、トークンさえ有効ならハンドラーを呼び出すこと", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "some-uid",
    } as never);
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ authUid: req.authUid });
    });
    const wrapped = withAuth(handler);
    const { req, res } = createMockReqRes({ authorization: "Bearer valid-token" });

    await wrapped(req, res as never);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ authUid: "some-uid" });
  });
});
