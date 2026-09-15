import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { generateMonthlyReviewOgpImage } from "@/lib/subhandlers/stats";
import { accessError, writeV2Result } from "@/middlewares/api/apiResult";
import { parseMonthlyReviewQuery } from "@/lib/subhandlers/stats/monthlyReviewV2/routeQuery";

export default withUserApiHandler(
  parseMonthlyReviewQuery,
  async (req, res, query) => {
    try {
      res.setHeader("Content-Type", "image/png");
      // OGPクローラー・CDNでのキャッシュを許容しつつ、月次データの更新は
      // 反映されるよう短めのs-maxageにする
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      if (req.method === "HEAD") {
        res.status(200).end();
        return;
      }
      const png = await generateMonthlyReviewOgpImage(query);
      res.status(200).send(png);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message });
    }
  },
  {
    onReject: (res, access) => writeV2Result(res, accessError(access)!),
  },
);
