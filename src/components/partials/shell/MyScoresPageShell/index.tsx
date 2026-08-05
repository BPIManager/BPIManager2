import { ReactNode } from "react";
import { useRouter } from "next/router";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { useUser } from "@/contexts/users/UserContext";
import AccountSettings from "@/components/partials/modal/AccountSettings";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import { PageLoader } from "@/components/ui/loading-spinner";

interface MyScoresPageShellProps {
  /** 翻訳済みのタイトル文言。シェル側で「— Version X」を付与する */
  titlePrefix: string;
  renderTable: (params: {
    userId: string;
    version: string | undefined;
  }) => ReactNode;
}

/**
 * `/my/[version]`, `/my/all/[version]`, `/my/unplayed/[version]` で共通の
 * 「router準備待ち → 未ログイン時のAccountSettings → LoginRequiredCard分岐」を
 * まとめたページシェル。表示するテーブル本体だけを呼び出し側が渡す。
 */
const MyScoresPageShell = ({
  titlePrefix,
  renderTable,
}: MyScoresPageShellProps) => {
  const router = useRouter();
  const { version } = router.query;
  const { user, isLoading: isUserLoading, fbUser } = useUser();

  const isReady = router.isReady && !isUserLoading;

  if (!isReady) {
    return <PageLoader />;
  }

  const targetVersion = typeof version === "string" ? version : undefined;

  return (
    <>
      {!user && <AccountSettings />}

      <Meta noIndex title={`${titlePrefix} — Version ${targetVersion || ""}`} />

      <DashboardLayout>
        {!fbUser?.uid ? (
          <LoginRequiredCard />
        ) : (
          renderTable({ userId: fbUser.uid, version: targetVersion })
        )}
      </DashboardLayout>
    </>
  );
};

export default MyScoresPageShell;
