import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { generateMonthlyReviewOgpImage } from "@/lib/subhandlers/stats";
import { accessError, writeV2Result } from "@/middlewares/api/apiResult";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const userId = req.query.userId as string;
    const version = req.query.version as string;
    const month = req.query.month as string;
    const isYearMode = /^\d{4}$/.test(month ?? "");
    const isMonthMode = /^\d{4}-\d{2}$/.test(month ?? "");
    const isAllMode = month === "all";
    const isValidVersion = (IIDX_VERSIONS as readonly string[]).includes(version);
    if (!userId || typeof userId !== "string") {
      res.status(400).json({ message: "Invalid userId" });
      return null;
    }
    if (
      !version ||
      !isValidVersion ||
      !month ||
      (!isYearMode && !isMonthMode && !isAllMode)
    ) {
      res.status(400).json({
        message:
          "Missing or invalid params: version, month (YYYY-MM, YYYY or all)",
      });
      return null;
    }
    return { userId, version, month };
  },
  async (req, res, query) => {
    try {
      const png = await generateMonthlyReviewOgpImage(query);
      res.setHeader("Content-Type", "image/png");
      // OGPクローラー・CDNでのキャッシュを許容しつつ、月次データの更新は
      // 反映されるよう短めのs-maxageにする
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
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
