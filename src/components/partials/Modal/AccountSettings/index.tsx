"use client";

import { useState } from "react";
import { User2, Check, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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

import { useUser } from "@/contexts/users/UserContext";
import { authActions } from "@/lib/firebase/auth";
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
    arenaPrivacy,
    setArenaPrivacy,
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
          if (!open && user && onClose) onClose();
        }}
      >
        <DialogContent className="flex max-h-[90vh] sm:max-w-2xl flex-col overflow-hidden rounded-2xl border-bpim-border bg-bpim-bg p-0 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-bpim-border px-6 py-4">
            <div className="flex items-center gap-3">
              <User2 className="h-5 w-5 text-bpim-muted" />
              <DialogTitle className="text-lg font-bold tracking-tight text-bpim-text">
                プロフィール設定
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase text-bpim-muted">
                    アイコン <span className="text-bpim-danger">*</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <AvatarSection
                    image={formData.profileImage}
                    onChange={(url) =>
                      setFormData({ ...formData, profileImage: url })
                    }
                    setIsImageModalOpen={setIsImageModalOpen}
                  />
                </div>
                <p className="text-[11px] text-bpim-muted">
                  公序良俗に反しないアイコンを設定してください
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-[11px] font-bold uppercase text-bpim-muted">
                    表示名 <span className="text-bpim-danger">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      className={cn(
                        "h-10 bg-bpim-surface-2/60 border-bpim-border pr-9 focus-visible:ring-blue-500",
                        nameStatus.error &&
                          "border-bpim-danger focus-visible:ring-bpim-danger",
                      )}
                      value={formData.userName}
                      onChange={(e) =>
                        setFormData({ ...formData, userName: e.target.value })
                      }
                      placeholder="Player Name"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameStatus.isChecking ? (
                        <LoadingSpinner size="sm" className="text-bpim-muted" />
                      ) : formData.userName && !nameStatus.error ? (
                        <Check className="h-4 w-4 text-bpim-success" />
                      ) : nameStatus.error ? (
                        <X className="h-4 w-4 text-bpim-danger" />
                      ) : null}
                    </div>
                  </div>
                  {nameStatus.error ? (
                    <p className="text-[11px] font-bold text-bpim-danger">
                      {nameStatus.error}
                    </p>
                  ) : (
                    <p className="text-[11px] text-bpim-muted">
                      {nameStatus.isChecking
                        ? "重複を確認中..."
                        : "表示名を設定してください"}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[11px] font-bold uppercase text-bpim-muted">
                    IIDX ID <span className="text-bpim-danger">*</span>
                  </Label>
                  <Input
                    className={cn(
                      "h-10 bg-bpim-surface-2/60 border-bpim-border font-mono focus-visible:ring-blue-500",
                      !validateIidxId(formData.iidxId) &&
                        "border-bpim-danger focus-visible:ring-bpim-danger",
                    )}
                    value={formData.iidxId}
                    onChange={(e) =>
                      setFormData({ ...formData, iidxId: e.target.value })
                    }
                    placeholder="00000000"
                  />
                  {!validateIidxId(formData.iidxId) ? (
                    <p className="text-[11px] font-bold text-bpim-danger">
                      8桁のIIDX IDを入力してください
                    </p>
                  ) : (
                    <p className="text-[11px] text-bpim-muted">半角数字8桁</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-bold uppercase text-bpim-muted">
                  X ユーザー名
                </Label>
                <div className="flex h-10 overflow-hidden rounded-md border border-bpim-border bg-bpim-surface-2/60 focus-within:ring-2 focus-within:ring-blue-500">
                  <div className="flex items-center border-r border-bpim-border px-3 text-sm text-bpim-muted">
                    @
                  </div>
                  <input
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-bpim-text outline-none placeholder:text-bpim-subtle"
                    value={formData.xId}
                    onChange={handleXIdChange}
                    placeholder="username"
                  />
                </div>
                <p className="text-[11px] text-bpim-muted">最大15文字</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-[11px] font-bold uppercase text-bpim-muted">
                  自己紹介
                </Label>
                <Textarea
                  className={cn(
                    "min-h-22 bg-bpim-surface-2/60 border-bpim-border focus-visible:ring-blue-500",
                    formData.bio.length > 1000 && "border-bpim-danger",
                  )}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="自己紹介を入力..."
                />
                <p
                  className={cn(
                    "text-right text-[11px]",
                    formData.bio.length > 1000
                      ? "font-bold text-bpim-danger"
                      : "text-bpim-muted",
                  )}
                >
                  {formData.bio.length} / 1000
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
                <p className="text-[11px] font-bold uppercase text-bpim-muted">
                  詳細情報の公開設定
                </p>
                <p className="text-[11px] text-bpim-muted">
                  それぞれの情報をプロフィールページで公開するかどうか選択できます。
                  <br />
                  公開設定にした場合、シーズン・日付ごとのアリーナクラス・順位などの推移を表示できます(予定)。
                  <br />
                  ※それぞれの情報は毎日午前1時頃に自動的に最新状態が反映されます。
                </p>
                {(
                  [
                    { key: "showArenaClass", label: "アリーナクラス" },
                    { key: "showArea", label: "所属エリア" },
                    { key: "showGrade", label: "段位（SP / DP）" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-bpim-text">{label}</span>
                    <Switch
                      checked={arenaPrivacy[key]}
                      onCheckedChange={(checked) =>
                        setArenaPrivacy({ ...arenaPrivacy, [key]: checked })
                      }
                      className="shrink-0 data-[state=checked]:bg-bpim-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-bpim-border bg-bpim-surface-2/60 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-bpim-text">
                    プロフィールを公開
                  </span>
                  <span className="text-[11px] text-bpim-muted">
                    他のユーザーがあなたを見つけられるようになります
                  </span>
                  {!formData.isPublic && (
                    <span className="mt-0.5 text-[11px] font-bold text-bpim-danger">
                      機能を最大限利用するため公開を推奨します
                    </span>
                  )}
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublic: checked })
                  }
                  className="shrink-0 data-[state=checked]:bg-bpim-primary"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-bpim-border px-6 py-4">
            <Button
              className="h-10 w-full rounded-xl bg-bpim-primary text-sm font-black hover:bg-bpim-primary/90 active:scale-[0.98] disabled:opacity-50 mb-2"
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
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
