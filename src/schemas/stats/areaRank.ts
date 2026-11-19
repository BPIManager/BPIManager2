import { z } from "zod";

export const areaRankQuerySchema = z.object({ userId: z.string() });
