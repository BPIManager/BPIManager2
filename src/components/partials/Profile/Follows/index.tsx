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
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-6 shadow-xl backdrop-blur-md">
        <Tabs value={type} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-xl border border-white/5 bg-white/5 p-1">
            <TabsTrigger
              value="following"
              className="flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <LuUserCheck className="h-4 w-4" />
              フォロー
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <LuUsers className="h-4 w-4" />
              フォロワー
            </TabsTrigger>
          </TabsList>

          <TabsContent value={type} className="mt-0 outline-none">
            {users.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <p className="text-sm font-medium text-slate-500">
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
                      className="text-slate-400 hover:bg-white/5 hover:text-white"
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
                    <LuLoader className="h-8 w-8 animate-spin text-blue-500" />
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
