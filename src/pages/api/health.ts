import { NextApiRequest, NextApiResponse } from "next";

/**
 * デプロイのヘルスチェック用。deploy/deploy.sh が切り替え後にこの応答を待ってからリリースを確定する。
 * DB・Firebase・認証には触れず、依存先の一時不調でロールバックされないよう起動と HTTP 応答のみ確認する。
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "method_not_allowed" });
  }

  return res.status(200).json({
    status: "ok",
    commit: process.env.GIT_COMMIT ?? null,
    time: new Date().toISOString(),
  });
}
