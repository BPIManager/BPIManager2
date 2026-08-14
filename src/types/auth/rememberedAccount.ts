export type RememberedAccountProvider = "google.com" | "twitter.com" | "oidc.line";

export interface RememberedAccount {
  uid: string;
  displayName: string;
  avatarUrl: string;
  /** 再認証時にプロバイダへlogin_hintとして渡し、アカウント選択の手間を減らすために保持する */
  email?: string;
  provider: RememberedAccountProvider;
  lastSwitchedAt: number;
  isPublic: boolean;
}

export function isRememberedAccountProvider(
  value: string | undefined,
): value is RememberedAccountProvider {
  return value === "google.com" || value === "twitter.com" || value === "oidc.line";
}
