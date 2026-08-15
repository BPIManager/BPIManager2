import { ReactNode } from "react";
import { useProfile } from "@/hooks/users/useProfile";
import { useUser } from "@/contexts/users/UserContext";
import DashboardLayout from "@/components/partials/shell/DashboardLayout";
import { PageContainer } from "@/components/partials/common/PageChrome/Header";
import FetchErrorState from "@/components/partials/common/ErrorStates/FetchErrorState";
import { Lock, UserMinus } from "lucide-react";
import ModeSwitchBanner from "@/components/partials/common/Rivals/ModeSwitch/ui";
import ProfileSideBar from "@/components/partials/common/Profile/Sidebar/ui";
import { ProfileProvider } from "@/contexts/profile/ProfileContext";
import { FilterProvider } from "@/contexts/stats/FilterContext";
import { PageLoader } from "@/components/ui/loading-spinner";

interface ProfileLayoutShellProps {
  userId: string;
  bannerType: "user" | "rival";
  /** サイドバーの隣(lg:col-span-3)に描画するタブ本体。profileは`useStaticProfile()`で取得する */
  children: () => ReactNode;
}

/**
 * ユーザー本人/ライバルのプロフィールページで共通の
 * 「ローディング → 非公開/未発見/エラー → サイドバー+タブのグリッド」までを丸ごとまとめたシェル。
 * サイドバー隣に表示するタブ本体だけをchildren(render prop)側に残す。
 */
const ProfileLayoutShell = ({
  userId,
  bannerType,
  children,
}: ProfileLayoutShellProps) => {
  const { user } = useUser();
  const {
    profile,
    isLoading,
    isError,
    isPrivate,
    isNotFound,
    toggleFollow,
    isUpdating,
    mutate,
  } = useProfile(userId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (isPrivate || isNotFound || isError || !profile) {
    return (
      <DashboardLayout>
        <PageContainer>
          <FetchErrorState
            error={isError}
            title={
              isPrivate
                ? "非公開のプロフィール"
                : isNotFound
                  ? "ユーザーが見つかりません"
                  : undefined
            }
            description={
              isPrivate
                ? "このユーザーはプロフィールを非公開に設定しています。"
                : isNotFound
                  ? "指定されたIDのユーザーは存在しないか、退会した可能性があります。"
                  : undefined
            }
            icon={
              isPrivate ? (
                <Lock size={48} />
              ) : isNotFound ? (
                <UserMinus size={48} />
              ) : undefined
            }
            homeHref="/"
          />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <FilterProvider>
      <ProfileProvider profile={profile}>
        <DashboardLayout>
          <PageContainer>
            {user && (
              <ModeSwitchBanner
                type={bannerType}
                targetUserId={profile.userId}
                isMe={user.userId === profile.userId}
              />
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <aside className="lg:col-span-1">
                <ProfileSideBar
                  onFollowToggle={toggleFollow}
                  isUpdating={isUpdating}
                  onRelationshipChange={() => mutate()}
                />
              </aside>

              <div className="lg:col-span-3">{children()}</div>
            </div>
          </PageContainer>
        </DashboardLayout>
      </ProfileProvider>
    </FilterProvider>
  );
};

export default ProfileLayoutShell;
