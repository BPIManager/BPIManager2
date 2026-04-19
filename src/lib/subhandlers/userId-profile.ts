import { latestVersion } from "@/constants/latestVersion";
import { NextApiRequest, NextApiResponse } from "next";
import { socialRepo } from "../db/social";
import { usersRepo } from "../db/users";
import { v4 as uuidv4 } from "uuid";
import { AccessResult } from "@/middlewares/api/withApi";
import { parseBody } from "@/services/nextRequest/parseBody";
import { profileUpsertSchema } from "@/schemas/profile/upsert";

/**
 * プロフィール取得 API のレスポンス型。
 * `isCompare` が `true` の場合は `compare` フィールドに勝敗統計とレーダーデータを含む。
 */
interface ProfileResponse {
  profile: Awaited<ReturnType<typeof usersRepo.getUserProfileSummary>>;
  compare?: {
    winLoss: Awaited<ReturnType<typeof socialRepo.getWinLossStats>> | null;
    radar: Record<string, number> | null;
  };
}

/**
 * ユーザープロフィールを取得する API サブハンドラー。
 *
 * 非公開プロフィールへのアクセス制御、フォロー関係の確認を行う。
 * `isCompare` が `true` の場合は勝敗統計とレーダーデータも返す。
 *
 * @param req - Next.js API リクエスト
 * @param res - Next.js API レスポンス
 * @param uid - 取得対象ユーザーの ID
 * @param access - 認証・アクセス検証結果
 * @param isCompare - 比較データ（勝敗・レーダー）を含めるかどうか
 */
export async function handleGetProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
  access: AccessResult,
  isCompare: boolean,
) {
  if (!access.hasAccess)
    return res
      .status(access.error!.status)
      .json({ message: access.error!.message });

  const viewerId = access.viewerId;
  const version = latestVersion;

  const [profile, winLoss, radar] = await Promise.all([
    usersRepo.getUserProfileSummary(uid, viewerId),
    isCompare && viewerId
      ? socialRepo.getWinLossStats(viewerId, uid, version)
      : null,
    isCompare ? socialRepo.getUserRadar(uid, version) : null,
  ]);

  if (!profile) return res.status(404).json({ message: "User not found" });

  if (
    profile.isPublic !== 1 &&
    viewerId !== uid &&
    !profile.relationship?.isFollowing
  ) {
    return res.status(403).json({ message: "This profile is private" });
  }

  const response: ProfileResponse = { profile };
  if (isCompare) {
    response.compare = {
      winLoss,
      radar: radar
        ? {
            NOTES: Number(radar.notes),
            CHORD: Number(radar.chord),
            PEAK: Number(radar.peak),
            CHARGE: Number(radar.charge),
            SCRATCH: Number(radar.scratch),
            SOFLAN: Number(radar.soflan),
          }
        : null,
    };
  }
  return res.status(200).json(response);
}

/**
 * 新規ユーザープロフィールを作成する API サブハンドラー（POST）。
 *
 * 既にプロフィールが存在する場合は 409 エラーを返す。
 *
 * @param req - Next.js API リクエスト
 * @param res - Next.js API レスポンス
 * @param uid - 作成対象ユーザーの ID
 */
export async function handleCreateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const existing = await usersRepo.getUserProfileSummary(uid);
  if (existing)
    return res
      .status(409)
      .json({ message: "Profile already exists. Use PATCH to update." });

  return await upsert(req, res, uid);
}

/**
 * 既存ユーザープロフィールを更新する API サブハンドラー（PATCH）。
 *
 * プロフィールが存在しない場合は 404 エラーを返す。
 *
 * @param req - Next.js API リクエスト
 * @param res - Next.js API レスポンス
 * @param uid - 更新対象ユーザーの ID
 */
export async function handleUpdateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const existing = await usersRepo.getUserProfileSummary(uid);
  if (!existing)
    return res
      .status(404)
      .json({ message: "Profile not found. Use POST to create." });

  return await upsert(req, res, uid);
}

/**
 * プロフィールの作成・更新共通ロジック。
 *
 * ユーザー名のバリデーションを行った後、`usersRepo.upsertUserProfile` を呼び出す。
 *
 * @param req - Next.js API リクエスト（ボディにプロフィールデータを含む）
 * @param res - Next.js API レスポンス
 * @param uid - 対象ユーザーの ID
 */
export async function upsert(
  req: NextApiRequest,
  res: NextApiResponse,
  uid: string,
) {
  const data = parseBody(profileUpsertSchema, req.body, res);
  if (!data) return;

  const result = await usersRepo.upsertUserProfile({
    ...data,
    userId: uid,
    version: latestVersion,
    batchId: uuidv4(),
  });
  return res.status(200).json(result);
}
