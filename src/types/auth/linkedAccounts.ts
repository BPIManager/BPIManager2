/** 連携解除・表示の対象にするログインプロバイダ。Firebase の providerId と一致させる。 */
export const LINKABLE_PROVIDER_IDS = [
  "google.com",
  "twitter.com",
  "oidc.line",
  "password",
] as const;

export type LinkableProviderId = (typeof LINKABLE_PROVIDER_IDS)[number];

/** password（メールアドレス）プロバイダの providerId */
export const EMAIL_PROVIDER_ID: LinkableProviderId = "password";

export interface LinkedAccount {
  providerId: string;
  /** password（メールアドレス）のみ値を持つ。SNS 連携は表示名等を返さない */
  email: string | null;
}
