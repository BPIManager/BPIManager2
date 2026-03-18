"use client";

import { useRouter } from "next/router";
import { LuUsers, LuUserCheck, LuLoader } from "react-icons/lu";
import { UserProfileLayout } from "@/components/partials/Profile/Layout/layout";
import { useFollowList } from "@/hooks/users/useFollowList";
import { UserFollowCard } from "./ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function FollowPage({
  type,
}: {
  type: "following" | "followers";
}) {
  const router = useRouter();
  const userId = router.query.userId as string;

  const { users, isLoading, isReachingEnd, loadMore } = useFollowList(
    userId,
    type,
  );

  if (!userId) return null;

  const handleTabChange = (value: string) => {
    router.push(`/users/${userId}/${value}`, undefined, {
      shallow: true,
    });
  };

  return (
    <UserProfileLayout userId={userId} currentTab="">
      <div className="rounded-2xl border border-bpim-border bg-bpim-bg/40 p-4 md:p-6 shadow-xl backdrop-blur-md">
        <Tabs value={type} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6 grid h-11 w-full grid-cols-2 items-stretch rounded-full border border-bpim-border bg-bpim-card/50 p-1.5 transition-all">
            <TabsTrigger
              value="following"
              className="flex h-full items-center justify-center gap-2 rounded-full text-xs font-bold transition-all data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text data-[state=active]:shadow-lg"
            >
              <LuUserCheck className="h-4 w-4" />
              <span>フォロー</span>
            </TabsTrigger>

            <TabsTrigger
              value="followers"
              className="flex h-full items-center justify-center gap-2 rounded-full text-xs font-bold transition-all data-[state=active]:bg-bpim-primary data-[state=active]:text-bpim-text data-[state=active]:shadow-lg"
            >
              <LuUsers className="h-4 w-4" />
              <span>フォロワー</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={type} className="mt-0 outline-none">
            {users.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm font-medium text-bpim-muted">
                  まだ誰もいません
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {users.map((user) => (
                    <UserFollowCard key={user.userId} user={user} />
                  ))}
                </div>

                {!isReachingEnd && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="text-bpim-muted hover:bg-bpim-overlay/50 hover:text-bpim-text"
                    >
                      {isLoading ? (
                        <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      さらに読み込む
                    </Button>
                  </div>
                )}

                {isLoading && users.length === 0 && (
                  <div className="flex justify-center py-10">
                    <LuLoader className="h-8 w-8 animate-spin text-bpim-text" />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserProfileLayout>
  );
}
