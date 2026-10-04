"use client";

import { useState } from "react";
import { Check, Plus, Settings2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/contexts/users/UserContext";
import { useIsOwnProfile } from "@/hooks/users/useIsOwnProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginRequiredCard } from "@/components/partials/common/Auth/LoginRequired/ui";
import AccountSettings from "@/components/partials/modal/AccountSettings";
import { cn } from "@/lib/utils";
import { UserRelationship } from "@/types/users/profile";
import { useTranslation } from "@/hooks/common/useTranslation";

const FollowSection = ({
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
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isLoggedIn = !!fbUser?.uid;
  const isMe = useIsOwnProfile(userId);

  if (isMe) {
    return (
      <>
        <Button
          onClick={() => setIsSettingsOpen(true)}
          variant="outline"
          className={cn("w-full rounded-full font-bold h-9", className)}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          {t("common.edit")}
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
      {relationship.isFollowing
        ? t("followSection.following")
        : t("followSection.follow")}
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
            <LoginRequiredCard isModal />
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
              {t("followSection.mutual")}
            </Badge>
          ) : relationship.isFollowedBy ? (
            <Badge
              variant="secondary"
              className="bg-bpim-primary/10 text-bpim-primary border-bpim-border px-2 py-0 text-[10px]"
            >
              {t("followSection.followedBy")}
            </Badge>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default FollowSection;
