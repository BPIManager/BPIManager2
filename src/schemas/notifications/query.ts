import { z } from "zod";

export const notificationsQuerySchema = z.object({
  type: z.enum(["all", "follow", "overtaken"]).default("all"),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type NotificationsQuery = z.output<typeof notificationsQuerySchema>;
