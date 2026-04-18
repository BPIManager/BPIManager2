"use client";

import { useState } from "react";
import { Check, Plus, Settings2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/contexts/users/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginRequiredCard } from "../../LoginRequired/ui";
import AccountSettings from "../../Modal/AccountSettings";
import { cn } from "@/lib/utils";
import { UserRelationship } from "@/types/users/profile";

export const FollowSection = ({
  relationship,
  onToggle,
  isUpdating,
  userId,
  className,
  onModal,
}: {
  relationship: UserRelationship;
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
          variant="outline"
          className={cn("w-full rounded-full font-bold h-9", className)}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          編集
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
        <LoadingSpinner size="sm" className="mr-2" />
      ) : relationship.isFollowing ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      {relationship.isFollowing ? "フォロー中" : "フォロー"}
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
              ? "bg-bpim-success text-bpim-bg hover:bg-bpim-success/80"
              : "bg-bpim-primary text-bpim-bg hover:bg-bpim-primary/80",
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
                "w-full rounded-full font-bold h-9",
                "bg-bpim-primary text-bpim-bg hover:bg-bpim-primary/80",
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
              className="bg-bpim-primary/10 text-bpim-primary border-bpim-border px-2 py-0 text-[10px]"
            >
              相互フォロー
            </Badge>
          ) : relationship.isFollowedBy ? (
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-bpim-border px-2 py-0 text-[10px]"
            >
              フォローされています
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
};
