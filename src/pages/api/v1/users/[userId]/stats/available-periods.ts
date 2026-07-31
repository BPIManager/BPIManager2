import { monthlyReviewRepo } from "@/lib/db/aggregates/monthly-review";
import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";

export interface AvailablePeriodsData {
  months: string[]; // YYYY-MM, desc order
}

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({ message: "Method Not Allowed" });
      return null;
    }

    const userId = req.query.userId as string;
    const version = req.query.version as string;

    if (!version) {
      res.status(400).json({ message: "Missing param: version" });
      return null;
    }

    return { userId, version };
  },
  async (req, res, { userId, version }) => {
    const months = await monthlyReviewRepo.getAvailableMonths(userId, version);
    return res.status(200).json({ months } satisfies AvailablePeriodsData);
  },
  {
    onError: (error, res) => {
      console.error("[available-periods]", error);
      return res.status(500).json({ message: "Internal Server Error" });
    },
  },
);
