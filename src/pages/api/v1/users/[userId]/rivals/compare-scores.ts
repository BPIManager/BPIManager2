import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { rivalRepo } from "@/lib/db/aggregates/rivalScores/rival";
import { compareScoresQuerySchema } from "@/schemas/rivals/compareScores";
import { parseQuery } from "@/services/nextRequest/parseBody";
import { MAX_COMPARISON_MEMBERS } from "@/constants/logic/rivalComparison";

/**
 * 比較ページの複数ライバル(1:N)比較(#287)用に、自分+選択したライバル群の
 * 楽曲ごと最新スコアをまとめて取得する。
 *
 * `rivalIds`は閲覧者が実際にフォローしており閲覧可能なユーザーだけに
 * サーバー側でも絞り込む（フロントのチェックボックス選択を信用しない）。
 * 人数上限（自分を含め`MAX_COMPARISON_MEMBERS`人）もサーバー側で強制する
 * （UIの選択上限をバイパスしたリクエストへの防御）。
 *
 * ルートに`userId`パラメータを持つため`withAuth`が自動的に本人確認を行う
 * （本人のみアクセス可能。閲覧者自身の比較選択のため）。
 */
async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const query = parseQuery(compareScoresQuerySchema, req.query, res);
  if (!query) return;

  const viewerId = req.authUid;

  if (query.rivalIds.length > MAX_COMPARISON_MEMBERS - 1) {
    return res.status(400).json({
      message: `rivalIds must not exceed ${MAX_COMPARISON_MEMBERS - 1}`,
    });
  }

  try {
    const visibleRivalIds = await rivalRepo.filterVisibleRivalIds(
      viewerId,
      query.rivalIds,
    );

    const scores = await rivalRepo.getMultiUserLatestScores({
      userIds: [viewerId, ...visibleRivalIds],
      version: query.version,
    });

    return res.status(200).json({ scores, rivalIds: visibleRivalIds });
  } catch (error) {
    console.error("Compare Scores API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
