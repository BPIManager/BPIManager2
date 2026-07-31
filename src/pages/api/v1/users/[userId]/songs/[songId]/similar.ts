import { withUserApiHandler } from "@/middlewares/api/withUserApiHandler";
import { songsRepo } from "@/lib/db/domains/songs";
import { latestVersion, IIDX_VERSIONS } from "@/constants/iidx/iidxVersions";
import { IIDXVersion } from "@/types/iidx/version";

export default withUserApiHandler(
  (req, res) => {
    if (req.method !== "GET") {
      res.status(405).end();
      return null;
    }
    const { userId } = req.query;
    return { userId: userId as string };
  },
  async (req, res) => {
    const { songId } = req.query;
    const songIdNum = parseInt(String(songId), 10);
    if (isNaN(songIdNum))
      return res.status(400).json({ message: "Invalid songId" });

    const rawVersion = String(req.query.version ?? "");
    const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
      ? (rawVersion as IIDXVersion)
      : latestVersion;

    const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);

    const mode = req.query.mode === "global" ? "global" : "profile";

    const result = await songsRepo.getSimilarSongs(
      songIdNum,
      version,
      limit,
      mode,
    );
    return res.status(200).json(result);
  },
);
