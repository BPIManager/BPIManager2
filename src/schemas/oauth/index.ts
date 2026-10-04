import { z } from "zod";

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/** https のみ許可。http はループバックホストに限る（RFC 8252）。javascript: 等は拒否 */
export function isSafeRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK_HOSTS.includes(url.hostname);
}

export const redirectUriSchema = z
  .string()
  .max(512)
  .refine(isSafeRedirectUri, "redirect_uri must be https (or http loopback)");

const redirectUrisSchema = z.array(redirectUriSchema).min(1).max(10);

export const registerClientSchema = z.object({
  redirect_uris: redirectUrisSchema,
  client_name: z.string().max(255).optional(),
});

export type RegisterClientInput = z.output<typeof registerClientSchema>;

export const consentSchema = z.object({
  client_id: z.string().min(1).max(255),
  redirect_uri: redirectUriSchema,
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal("S256"),
  state: z.string().max(2048).optional(),
});

export type ConsentInput = z.output<typeof consentSchema>;

export const tokenRequestSchema = z.object({
  grant_type: z.string(),
  code: z.string().min(1),
  redirect_uri: redirectUriSchema,
  client_id: z.string().min(1).max(255),
  code_verifier: z.string().min(43).max(128),
  client_secret: z.string().optional(),
});

export type TokenRequestInput = z.output<typeof tokenRequestSchema>;

export const manageClientSchema = z.object({
  redirect_uris: redirectUrisSchema,
});

export type ManageClientInput = z.output<typeof manageClientSchema>;
