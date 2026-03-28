import fs from "fs/promises";
import path from "path";
import { latestVersion } from "@/constants/latestVersion";
import { metricsRepo } from "@/lib/db/metrics";
import { BpiCalculator } from "@/lib/bpi";

interface ArenaGroupEntry {
  title: string;
  difficulty: string;
  notes: number;
  maxScore: number;
  averages: Record<
    string,
    { avgExScore: number; rate: number; count: number; avgBpi?: number }
  >;
}

const START_VERSION = 26;
const LEVELS = [11, 12];
const OUTPUT_DIR = path.join(process.cwd(), "public/data/metrics/arena");

const getVersions = () => {
  const latest = Number(latestVersion);
  const count = latest - START_VERSION + 1;
  return Array.from({ length: count }, (_, i) => String(latest - i));
};

export async function generateArenaJson() {
  const versions = getVersions();

  console.log(`Starting JSON Generation for versions: ${versions.join(", ")}`);

  const songs = await metricsRepo.getAllSongs();
  const songMap = new Map(
    songs.map((s) => [`${s.title}[${s.difficulty}]`, s.notes]),
  );

  const songDefs = await metricsRepo.getSongDefs();
  const defMap = new Map(
    songDefs.map((d) => [`${d.title}[${d.difficulty}]`, d]),
  );

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const v of versions) {
    for (const level of LEVELS) {
      console.log(`Processing: Ver.${v} Level.${level}`);

      const arenaData = await metricsRepo.getArenaAverageScores(v, level);

      const grouped = arenaData.reduce((acc: Record<string, ArenaGroupEntry>, row) => {
        const key = `${row.title}[${row.difficulty}]`;
        const notes = songMap.get(key) || 0;
        const maxScore = notes * 2;
        const avgExScore = Number(row.avgExScore);
        const rate = maxScore > 0 ? (avgExScore / maxScore) * 100 : 0;

        const def = defMap.get(key);
        const avgBpi =
          def && notes > 0
            ? BpiCalculator.calc(Math.round(avgExScore), {
                notes: def.notes,
                kaidenAvg: def.kaidenAvg,
                wrScore: def.wrScore,
                coef: def.coef,
              })
            : null;

        if (!acc[key]) {
          acc[key] = {
            title: row.title,
            difficulty: row.difficulty,
            notes,
            maxScore,
            averages: {},
          };
        }
        acc[key].averages[row.arenarank!] = {
          avgExScore: Math.round(avgExScore * 100) / 100,
          rate: parseFloat(rate.toFixed(2)),
          count: row.sampleSize,
          ...(avgBpi !== null && { avgBpi: Math.round(avgBpi * 100) / 100 }),
        };
        return acc;
      }, {});

      const finalResult = Object.values(grouped);
      const filePath = path.join(OUTPUT_DIR, `${v}_${level}.json`);
      await fs.writeFile(filePath, JSON.stringify(finalResult));
      console.log(`Saved: ${filePath}`);
    }
  }
  console.log("All JSON Generation Completed!");
}
