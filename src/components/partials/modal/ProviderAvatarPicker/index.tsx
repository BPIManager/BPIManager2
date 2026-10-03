"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GoogleIcon,
  LineIcon,
  XIcon,
} from "@/components/partials/common/Auth/ProviderIcons";
import { useTranslation } from "@/hooks/common/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

interface ProviderAvatarInfo {
  providerId: string;
  labelKey: TranslationKey;
  Icon: (props: { className?: string }) => React.JSX.Element;
}

/** 画像を提供しうる SNS 連携（メールアドレスは画像を持たないため対象外） */
const AVATAR_PROVIDERS: ProviderAvatarInfo[] = [
  { providerId: "google.com", labelKey: "settings.linked.provider.google", Icon: GoogleIcon },
  { providerId: "twitter.com", labelKey: "settings.linked.provider.twitter", Icon: XIcon },
  { providerId: "oidc.line", labelKey: "settings.linked.provider.line", Icon: LineIcon },
];

/**
 * プロフィール画像として保存する URL に整える。X の画像は `_normal` を外して大きいサイズにする
 * （従来の「連携先アカウントのアイコン」と同じ変換）。
 */
const toProfileImageUrl = (url: string) => url.replace("_normal", "");

interface Candidate extends ProviderAvatarInfo {
  url: string;
}

const collectCandidates = (): Candidate[] => {
  const providerData = auth.currentUser?.providerData ?? [];
  return AVATAR_PROVIDERS.flatMap((info) => {
    const photo = providerData.find((p) => p.providerId === info.providerId)?.photoURL;
    return photo ? [{ ...info, url: toProfileImageUrl(photo) }] : [];
  });
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 決定時に選んだ画像 URL を渡す */
  onSelect: (url: string) => void;
}

/**
 * 連携先アカウントの画像から、プロフィール画像を選ぶモーダル。選択中の画像をプレビューしてから決定する。
 */
export default function ProviderAvatarPicker({ open, onOpenChange, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-bpim-border bg-bpim-bg p-0 shadow-2xl">
        <DialogHeader className="border-b border-bpim-border px-6 py-4">
          <DialogTitle className="text-lg font-bold tracking-tight text-bpim-text">
            {t("settings.profile.avatar.picker.title")}
          </DialogTitle>
        </DialogHeader>
        <PickerBody
          onSelect={(url) => {
            onSelect(url);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

/** モーダルが開いている間だけマウントされ、開くたびに候補と選択を初期化する */
function PickerBody({
  onSelect,
  onCancel,
}: {
  onSelect: (url: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [candidates] = useState(collectCandidates);
  const currentPhoto = auth.currentUser?.photoURL ? toProfileImageUrl(auth.currentUser.photoURL) : null;
  const defaultId = candidates.find((c) => c.url === currentPhoto)?.providerId ?? candidates[0]?.providerId ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? defaultId;
  const active = candidates.find((c) => c.providerId === activeId);

  if (candidates.length === 0) {
    return (
      <>
        <div className="px-6 py-8 text-center text-sm text-bpim-muted">
          {t("settings.profile.avatar.picker.empty")}
        </div>
        <DialogFooter className="border-t border-bpim-border px-6 py-4">
          <Button variant="outline" className="h-9 rounded-lg" onClick={onCancel}>
            {t("settings.profile.avatar.picker.cancel")}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2 px-6 pt-6">
        <Avatar className="h-24 w-24 border-2 border-bpim-primary shadow-lg shadow-bpim-primary/20">
          <AvatarImage src={active?.url} alt="" className="object-cover" />
          <AvatarFallback className="bg-bpim-surface-2 text-bpim-muted text-xs">
            {t("settings.profile.avatar.picker.preview")}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-3 p-6">
        {candidates.map((c) => {
          const isActive = c.providerId === activeId;
          return (
            <button
              key={c.providerId}
              type="button"
              onClick={() => setSelectedId(c.providerId)}
              className={
                "flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors " +
                (isActive
                  ? "border-bpim-primary bg-bpim-surface shadow-[0_0_0_3px] shadow-bpim-primary/20"
                  : "border-bpim-border bg-bpim-surface-2/40 hover:bg-bpim-overlay")
              }
            >
              <span className="flex items-center gap-3 text-sm font-bold text-bpim-text">
                <c.Icon className="h-4 w-4 text-bpim-muted" />
                {t(c.labelKey)}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={c.url} alt="" className="object-cover" />
                <AvatarFallback className="bg-bpim-surface-2 text-bpim-muted text-[10px]">
                  {t(c.labelKey)}
                </AvatarFallback>
              </Avatar>
            </button>
          );
        })}
      </div>

      <DialogFooter className="border-t border-bpim-border px-6 py-4">
        <Button variant="outline" className="h-9 rounded-lg" onClick={onCancel}>
          {t("settings.profile.avatar.picker.cancel")}
        </Button>
        <Button
          className="h-9 rounded-lg font-bold"
          disabled={!active}
          onClick={() => active && onSelect(active.url)}
        >
          {t("settings.profile.avatar.picker.apply")}
        </Button>
      </DialogFooter>
    </>
  );
}
