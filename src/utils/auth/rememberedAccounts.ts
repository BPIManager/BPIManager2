import { RememberedAccount } from "@/types/auth/rememberedAccount";

const STORAGE_KEY = "bpim2_remembered_accounts_v1";

export function loadRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RememberedAccount[];
  } catch {
    return [];
  }
}

function saveRememberedAccounts(accounts: RememberedAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // localStorage unavailable (private mode etc.)
  }
}

/**
 * サインイン成功時に呼び出す。`bumpLastSwitchedAt`がfalseの場合は既存の
 * lastSwitchedAtを保持したままdisplayName/avatarUrl/isPublicのみ更新する
 * （プロフィール編集による再フェッチ等、実際のアカウント切り替えを伴わない
 * 更新で一覧の並び順が変わらないようにするため）。
 */
export function upsertRememberedAccount(
  account: Omit<RememberedAccount, "lastSwitchedAt">,
  { bumpLastSwitchedAt = true }: { bumpLastSwitchedAt?: boolean } = {},
) {
  const accounts = loadRememberedAccounts();
  const existing = accounts.find((a) => a.uid === account.uid);
  const lastSwitchedAt =
    bumpLastSwitchedAt || !existing ? Date.now() : existing.lastSwitchedAt;

  const next = [
    { ...account, lastSwitchedAt },
    ...accounts.filter((a) => a.uid !== account.uid),
  ];
  saveRememberedAccounts(next);
}

export function removeRememberedAccount(uid: string) {
  saveRememberedAccounts(loadRememberedAccounts().filter((a) => a.uid !== uid));
}
