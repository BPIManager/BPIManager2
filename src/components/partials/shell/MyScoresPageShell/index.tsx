import { ReactNode } from "react";
import { useRouter } from "next/router";
import { Meta } from "@/components/partials/common/PageChrome/Head";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { useUser } from "@/contexts/users/UserContext";
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
 * /my 系ページ共通の「router 準備待ち → LoginRequiredCard 分岐」シェル。表示するテーブル本体のみ呼び出し側が渡す。
 */
const MyScoresPageShell = ({
  titlePrefix,
  renderTable,
}: MyScoresPageShellProps) => {
  const router = useRouter();
  const { version } = router.query;
  const { isLoading: isUserLoading, fbUser } = useUser();

  const isReady = router.isReady && !isUserLoading;

  if (!isReady) {
    return <PageLoader />;
  }

  const targetVersion = typeof version === "string" ? version : undefined;

  return (
    <>
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
