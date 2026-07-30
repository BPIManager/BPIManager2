import { z } from "zod";

export const registerClientSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  client_name: z.string().optional(),
});

export type RegisterClientInput = z.output<typeof registerClientSchema>;

export const consentSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  code_challenge: z.string().min(1),
  code_challenge_method: z.literal("S256"),
  state: z.string().optional(),
});

export type ConsentInput = z.output<typeof consentSchema>;

export const tokenRequestSchema = z.object({
  grant_type: z.string(),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  code_verifier: z.string().min(1),
  client_secret: z.string().optional(),
});

export type TokenRequestInput = z.output<typeof tokenRequestSchema>;

export const manageClientSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
});

export type ManageClientInput = z.output<typeof manageClientSchema>;
