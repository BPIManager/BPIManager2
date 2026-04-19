import { z } from "zod";

export const accountDeletionSchema = z.object({
  confirmUserName: z.string().min(1),
});

export type AccountDeletionInput = z.input<typeof accountDeletionSchema>;
