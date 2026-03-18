"use client";

import { useState } from "react";
import { User2, Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
import { arenaRanksCollection } from "@/constants/arenaRank";
import { ImageUploadModal } from "../ImageCrop/ui";
import { useEditProfile } from "@/hooks/users/useEditProfile";
import { AvatarSection } from "./avatar";
import { cn } from "@/lib/utils";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AccountSettings({ isOpen, onClose }: Props) {
  const { user, isLoading } = useUser();
  const { isSignedIn } = authActions;
  const {
    formData,
    setFormData,
    nameStatus,
    fbUid,
    isSubmitting,
    handleSubmit,
    isValid,
  } = useEditProfile(onClose);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const validateIidxId = (id: string) => {
    if (!id) return false;
    return /^\d{8}$/.test(id.replace(/-/g, ""));
  };

  const handleXIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 15);
    setFormData({ ...formData, xId: value });
  };

  const finalOpen = isOpen || (!isLoading && isSignedIn() && !user);

  return (
    <>
      <Dialog
        open={finalOpen}
        onOpenChange={(open) => {
          if (!open && user && onClose) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-w-md overflow-y-auto max-h-[90vh] rounded-2xl border-bpim-border bg-bpim-bg p-6 shadow-2xl">
          <DialogHeader className="border-b border-bpim-border pb-4">
            <div className="flex items-center gap-3">
              <User2 className="h-5 w-5 text-bpim-text" />
              <DialogTitle className="text-xl font-bold tracking-tight text-bpim-text">
                プロフィール設定
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-8 py-6">
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-bold tracking-widest text-bpim-muted uppercase">
                アイコンを設定 <span className="text-bpim-danger">*</span>
              </Label>
              <div className="flex flex-col items-start gap-4">
                <AvatarSection
                  image={formData.profileImage}
                  onChange={(url) =>
                    setFormData({ ...formData, profileImage: url })
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImageModalOpen(true)}
                  className="h-8 border-bpim-border text-xs font-bold hover:bg-bpim-overlay/50"
                >
                  アイコンをアップロード
                </Button>
              </div>
              <p className="text-[10px] text-bpim-muted">
                公序良俗に反しないアイコンを設定してください
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="userName"
                className="text-xs font-bold tracking-widest text-bpim-muted uppercase"
              >
                表示名 <span className="text-bpim-danger">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="userName"
                  className={cn(
                    "h-10 bg-bpim-surface-2/60 border-bpim-border pr-10 focus-visible:ring-blue-500",
                    nameStatus.error &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  placeholder="Player Name"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  {nameStatus.isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-bpim-text" />
                  ) : formData.userName && !nameStatus.error ? (
                    <Check className="h-4 w-4 text-bpim-success" />
                  ) : nameStatus.error ? (
                    <X className="h-4 w-4 text-bpim-danger" />
                  ) : null}
                </div>
              </div>
              {nameStatus.error ? (
                <p className="text-[10px] font-bold text-bpim-danger">
                  {nameStatus.error}
                </p>
              ) : (
                <p className="text-[10px] text-bpim-muted">
                  {nameStatus.isChecking
                    ? "重複を確認中..."
                    : "ユーザー名を設定"}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="iidxId"
                className="text-xs font-bold tracking-widest text-bpim-muted uppercase"
              >
                IIDX ID <span className="text-bpim-danger">*</span>
              </Label>
              <Input
                id="iidxId"
                className={cn(
                  "h-10 bg-bpim-surface-2/60 border-bpim-border font-mono focus-visible:ring-blue-500",
                  !validateIidxId(formData.iidxId) &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
                value={formData.iidxId}
                onChange={(e) =>
                  setFormData({ ...formData, iidxId: e.target.value })
                }
                placeholder="00000000"
              />
              {!validateIidxId(formData.iidxId) && (
                <p className="text-[10px] font-bold text-bpim-danger">
                  8桁のIIDXIDを入力してください
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="xId"
                className="text-xs font-bold tracking-widest text-bpim-muted uppercase"
              >
                Xユーザー名
              </Label>
              <div className="flex h-10 w-full overflow-hidden rounded-md border border-bpim-border bg-bpim-surface-2/60 focus-within:ring-2 focus-within:ring-blue-500">
                <div className="flex items-center justify-center bg-bpim-surface-2/60 px-3 text-sm text-bpim-muted border-r border-bpim-border">
                  @
                </div>
                <input
                  id="xId"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-bpim-subtle"
                  value={formData.xId}
                  onChange={handleXIdChange}
                  placeholder="username"
                />
              </div>
              <p className="text-[10px] text-bpim-muted">
                Xアカウントをプロフィールに表示できます(最大15文字)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold tracking-widest text-bpim-muted uppercase">
                アリーナランク
              </Label>
              <Select
                value={formData.arenaRank}
                onValueChange={(val) =>
                  setFormData({ ...formData, arenaRank: val })
                }
              >
                <SelectTrigger className="h-10 border-bpim-border bg-bpim-surface-2/60 focus:ring-blue-500">
                  <SelectValue placeholder="未設定" />
                </SelectTrigger>
                <SelectContent className="border-bpim-border bg-bpim-bg">
                  {arenaRanksCollection.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="text-xs"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-bpim-muted">
                現在のアリーナランクを選択してください(アリーナ平均との比較が可能になります)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="bio"
                className="text-xs font-bold tracking-widest text-bpim-muted uppercase"
              >
                自己紹介
              </Label>
              <Textarea
                id="bio"
                className={cn(
                  "min-h-[100px] bg-bpim-surface-2/60 border-bpim-border focus-visible:ring-blue-500",
                  formData.bio.length > 1000 && "border-red-500",
                )}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
              <p
                className={cn(
                  "text-[10px] text-right",
                  formData.bio.length > 1000
                    ? "text-bpim-danger font-bold"
                    : "text-bpim-muted",
                )}
              >
                {formData.bio.length} / 1000
              </p>
            </div>

            <div className="flex flex-row items-center justify-between gap-4 rounded-xl border border-blue-500/20 bg-bpim-primary/5 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-bpim-text leading-none">
                  プロフィールを公開
                </span>
                <span className="text-[10px] text-bpim-muted">
                  他のユーザーがあなたを見つけられるようになります
                </span>
                {!formData.isPublic && (
                  <span className="text-[10px] font-bold text-bpim-danger mt-1">
                    BPIM2の機能を最大限利用するため、プロフィールの公開を推奨します
                  </span>
                )}
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
                className="data-[state=checked]:bg-bpim-primary"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-bpim-border pt-6">
            <Button
              className="w-full h-12 rounded-xl bg-bpim-primary text-base font-black hover:bg-bpim-primary transition-all active:scale-95 disabled:opacity-50"
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fbUid && (
        <ImageUploadModal
          uid={fbUid}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSuccess={(url) => setFormData({ ...formData, profileImage: url })}
        />
      )}
    </>
  );
}
