"use client";

import { useState } from "react";
import { Check, Plus, Settings2, Loader } from "lucide-react";
import { useUser } from "@/contexts/users/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginRequiredCard } from "../../LoginRequired/ui";
import AccountSettings from "../../Modal/AccountSettings";
import { cn } from "@/lib/utils";

export const FollowSection = ({
  relationship,
  onToggle,
  isUpdating,
  userId,
  className,
  onModal,
}: {
  relationship: any;
  onToggle?: () => void;
  isUpdating?: boolean;
  userId: string;
  className?: string;
  onModal?: boolean;
}) => {
  const { fbUser } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isLoggedIn = !!fbUser?.uid;
  const isMe = isLoggedIn && fbUser?.uid === userId;

  if (isMe) {
    return (
      <>
        <Button
          onClick={() => setIsSettingsOpen(true)}
          className={cn(
            "w-full rounded-full bg-green-500 font-bold text-black hover:bg-green-400 h-9",
            className,
          )}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          プロフィール編集
        </Button>
        <AccountSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </>
    );
  }

  const renderButtonContent = () => (
    <>
      {isUpdating ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : relationship.isFollowing ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {relationship.isFollowing ? "フォロー中" : "フォローする"}
    </>
  );

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {isLoggedIn ? (
        <Button
          onClick={onToggle}
          disabled={isUpdating}
          className={cn(
            "w-full rounded-full font-bold h-9 transition-all",
            relationship.isFollowing
              ? "bg-green-500 text-black hover:bg-green-400"
              : "bg-bpim-primary text-white hover:bg-bpim-primary",
            className,
          )}
        >
          {renderButtonContent()}
        </Button>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className={cn(
                "w-full rounded-full bg-bpim-primary font-bold text-white h-9",
                className,
              )}
            >
              {renderButtonContent()}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md border-none bg-transparent p-0 shadow-none outline-none">
            <LoginRequiredCard />
          </DialogContent>
        </Dialog>
      )}

      {!onModal && (
        <div className="flex justify-center h-5">
          {relationship.isMutual ? (
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-blue-500/20 px-2 py-0 text-[10px]"
            >
              相互フォロー
            </Badge>
          ) : relationship.isFollowedBy ? (
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-blue-500/20 px-2 py-0 text-[10px]"
            >
              フォローされています
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
};
