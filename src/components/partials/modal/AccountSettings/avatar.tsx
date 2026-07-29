"use client";

import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "@/hooks/common/useTranslation";

interface AvatarSectionProps {
  image: string;
  onChange: (url: string) => void;
  setIsImageModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const AvatarSection = ({
  image,
  onChange,
  setIsImageModalOpen,
}: AvatarSectionProps) => {
  const { t } = useTranslation();
  const useServiceIcon = () => {
    const photoURL = auth.currentUser?.photoURL;
    if (photoURL) onChange(photoURL);
  };

  const useDiceBearIcon = () => {
    const seed = Math.random().toString(36).substring(7);
    onChange(`https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`);
  };

  return (
    <div className="flex items-center gap-6 py-2">
      <Avatar className="h-18 w-18 border-2 border-bpim-primary shadow-lg shadow-bpim-primary/20">
        <AvatarImage
          src={image}
          alt="Avatar Preview"
          className="object-cover"
        />
        <AvatarFallback className="bg-bpim-surface-2 text-bpim-muted text-xs">
          Preview
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1.5">
        <Button
          variant="outline"
          size="xs"
          onClick={useServiceIcon}
          className="h-7 border-bpim-border px-3 text-[10px] font-bold hover:bg-bpim-overlay/50 hover:text-bpim-primary"
        >
          {t("settings.profile.avatar.useService")}
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={useDiceBearIcon}
          className="h-7 border-bpim-border px-3 text-[10px] font-bold hover:bg-bpim-overlay/50 hover:text-bpim-primary"
        >
          {t("settings.profile.avatar.random")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImageModalOpen(true)}
          className="ml-auto h-7 shrink-0 border-bpim-border text-[10px] font-bold hover:bg-bpim-overlay/50"
        >
          {t("settings.profile.avatar.upload")}
        </Button>
      </div>
    </div>
  );
};
