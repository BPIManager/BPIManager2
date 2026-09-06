import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/middlewares/api/withAuth";
import {
  handleIidxTowerGet,
  handleIidxTowerPost,
} from "@/lib/subhandlers/iidxTower";
import { writeV1Result } from "@/middlewares/api/apiResult";

const postHandler = withAuth(async (req, res) => {
  const { result } = await handleIidxTowerPost(req);
  writeV1Result(res, result);
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { result } = await handleIidxTowerGet(req);
    return writeV1Result(res, result);
  }
  if (req.method === "POST") {
    return postHandler(req, res);
  }
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
