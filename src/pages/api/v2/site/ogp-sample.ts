import { generateSampleMonthlyReviewOgpImage } from "@/lib/subhandlers/stats";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  err,
  writeV2Result,
} from "@/middlewares/api/apiResult";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") return writeV2Result(res, err(405, "Method Not Allowed"));
  try {
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    if (req.method === "HEAD") return res.status(200).end();
    const png = await generateSampleMonthlyReviewOgpImage();
    res.status(200).send(png);
  } catch (error) {
    console.error(error);
    const message = "Internal Server Error";
    writeV2Result(res, err(500, message));
  }
}
