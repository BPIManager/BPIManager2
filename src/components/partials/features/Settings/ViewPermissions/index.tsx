"use client";

import { useUser } from "@/contexts/users/UserContext";
import ViewPermissionsSection from "@/components/partials/common/ViewPermissionsSection";

/**
 * 設定画面の「閲覧権限の管理」セクション。非公開アカウントのときだけ表示する。
 */
export default function ViewPermissionsSettingsUi() {
  const { user } = useUser();
  if (user?.isPublic !== 0) return null;

  return (
    <ViewPermissionsSection className="rounded-xl border border-bpim-border bg-bpim-bg p-6" />
  );
}
