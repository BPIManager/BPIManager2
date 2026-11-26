import type { NextApiRequest, NextApiResponse } from "next";
import { handleAllSongsMaster } from "@/lib/subhandlers/songs";
import { err, writeV2Result } from "@/middlewares/api/apiResult";
import { applyPublicGetCors } from "@/middlewares/api/publicCors";

/** 全難易度（☆1〜12）の楽曲マスタ。認証不要。ETag で条件付き取得できる */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyPublicGetCors(req, res)) return;
  if (req.method !== "GET") {
    return writeV2Result(res, err(405, "Method not allowed"));
  }
  const result = await handleAllSongsMaster();
  if (result.ok) {
    const etag = `"${result.body.version}"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    if (req.headers["if-none-match"] === etag) {
      res.status(304).end();
      return;
    }
  }
  writeV2Result(res, result);
}
