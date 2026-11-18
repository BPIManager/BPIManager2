import { z } from "zod";

/** チケット系の入力の検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */

export const ticketQuerySchema = z.object({
  ticketId: z.string("ticketId is required").min(1, "ticketId is required"),
});

export const ticketRecommendBodySchema = z.object({
  ticketIds: z
    .array(z.object({ ticketId: z.string(), expiresAt: z.string() }), "ticketIds is required")
    .min(1, "ticketIds is required")
    .max(50, "Too many ticketIds (max 50)"),
});
