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
    const rawVersion = String(req.query.version ?? "");
    const version = (IIDX_VERSIONS as readonly string[]).includes(rawVersion)
      ? (rawVersion as IIDXVersion)
      : latestVersion;

    const songs = await songsRepo.getSongList(version);
    return res.status(200).json(songs);
  },
);
