import { generateSampleMonthlyReviewOgpImage } from "@/lib/subhandlers/stats";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const png = await generateSampleMonthlyReviewOgpImage();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).send(png);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ message });
  }
}
