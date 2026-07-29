import { ReactNode } from "react";
import { DashboardLayout } from "@/components/partials/common/Main";
import { LoginRequiredCard } from "@/components/partials/common/LoginRequired/ui";

interface RequireAuthProps {
  /** trueの間はローディング表示をする。呼び出し側が「何を待つか」(router.isReady等)を判断し渡す */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** ローディング中の表示。省略時は共通のスピナーを表示する */
  loadingFallback?: ReactNode;
  /** ローディング完了後は認証状態に関わらず表示する内容(Meta等)。未ログイン時の画面にも出したい場合に使う */
  meta?: ReactNode;
  children: ReactNode;
}

const DefaultLoadingFallback = () => (
  <div className="flex h-[90vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-bpim-border border-t-bpim-primary" />
  </div>
);

/**
 * ログイン必須ページの「ローディング中」「未ログイン」ガードを共通化する。
 * どちらでもない場合はchildrenをそのまま描画する。
 */
export const RequireAuth = ({
  isLoading,
  isAuthenticated,
  loadingFallback,
  meta,
  children,
}: RequireAuthProps) => {
  if (isLoading) {
    return (
      <DashboardLayout>{loadingFallback ?? <DefaultLoadingFallback />}</DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        {meta}
        <LoginRequiredCard />
      </DashboardLayout>
    );
  }

  return <>{children}</>;
};
