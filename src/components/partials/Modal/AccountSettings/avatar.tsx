"use client";

import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarSectionProps {
  image: string;
  onChange: (url: string) => void;
}

export const AvatarSection = ({ image, onChange }: AvatarSectionProps) => {
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
      <Avatar className="h-[72px] w-[72px] border-2 border-bpim-primary shadow-lg shadow-bpim-primary/20">
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
          連携サービスを使用
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={useDiceBearIcon}
          className="h-7 border-bpim-border px-3 text-[10px] font-bold hover:bg-bpim-overlay/50 hover:text-bpim-primary"
        >
          ランダムに設定
        </Button>
      </div>
    </div>
  );
};
