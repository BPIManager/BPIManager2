import { z } from "zod";

export const followRequestSubmitSchema = z.object({
  token: z.string().min(1, "token is required"),
});

export type FollowRequestSubmit = z.output<typeof followRequestSubmitSchema>;
