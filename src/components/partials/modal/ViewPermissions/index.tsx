"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { AppTabsGroup } from "@/components/ui/complex/tabs";
import ActionConfirmDialog from "@/components/partials/modal/Confirmation";
import {
  useFollowRequests,
  type PendingFollowRequest,
} from "@/hooks/users/useFollowRequests";
import {
  useViewPermissions,
  type ApprovedFollower,
} from "@/hooks/users/useViewPermissions";
import { useTranslation } from "@/hooks/common/useTranslation";
import FollowInviteSection from "@/components/partials/modal/AccountSettings/followInvite";
import { PermissionRow } from "./ui";

type Tab = "pending" | "approved";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 非公開アカウントの閲覧権限の管理。承認待ち（リクエスト・未承認のフォロワー）の承認/却下と、
 * 承認済みフォロワーの閲覧権限の取り消しを行う。取り消してもフォロー関係は残り、承認待ちに戻る。
 */
export default function ViewPermissionsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<ApprovedFollower | null>(
    null,
  );
  const [isRevoking, setIsRevoking] = useState(false);

  const {
    requests,
    approve,
    reject,
    refresh: refreshRequests,
  } = useFollowRequests();
  const { approved, revoke, refresh: refreshApproved } = useViewPermissions();

  const matches = (name: string) =>
    name.toLowerCase().includes(search.trim().toLowerCase());
  const pending = useMemo(
    () => requests.filter((r) => matches(r.requesterName)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests, search],
  );
  const approvedList = useMemo(
    () => approved.filter((f) => matches(f.followerName)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approved, search],
  );

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch {
      toast.error(t("notifications.requests.actionFailed"));
    }
  };

  const handleApprove = (request: PendingFollowRequest) =>
    run(async () => {
      await approve(request);
      await refreshApproved();
    });
  const handleReject = (request: PendingFollowRequest) =>
    run(async () => {
      await reject(request);
      await refreshApproved();
    });

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    await run(async () => {
      await revoke(revokeTarget.followerId);
      await refreshRequests();
      setRevokeTarget(null);
    });
    setIsRevoking(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl border-bpim-border bg-bpim-bg p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 gap-1 border-b border-bpim-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-bpim-text">
              <ShieldCheck className="h-5 w-5 text-bpim-muted" />
              {t("viewPermissions.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-bpim-muted">
              {t("viewPermissions.desc")}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="flex min-h-0 flex-1 flex-col gap-3 p-4"
          >
            <AppTabsGroup
              visual="flat"
              tabs={[
                {
                  value: "pending",
                  label: `${t("viewPermissions.tab.pending")} (${requests.length})`,
                },
                {
                  value: "approved",
                  label: `${t("viewPermissions.tab.approved")} (${approved.length})`,
                },
              ]}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("viewPermissions.search")}
              className="h-9 border-bpim-border bg-bpim-bg text-bpim-text"
            />

            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-bpim-border">
              {tab === "pending" ? (
                pending.length === 0 ? (
                  search.trim() === "" ? (
                    // 承認待ちが無いときは、リクエストの受け口である招待URLをその場で確認・発行できるようにする
                    <div className="flex flex-col gap-3 p-4">
                      <p className="text-sm text-bpim-muted">
                        {t("viewPermissions.empty.pendingInvite")}
                      </p>
                      <FollowInviteSection />
                    </div>
                  ) : (
                    <p className="p-6 text-center text-sm text-bpim-muted">
                      {t("viewPermissions.empty.pending")}
                    </p>
                  )
                ) : (
                  pending.map((r) => (
                    <PermissionRow
                      key={`${r.kind}-${r.kind === "request" ? r.id : r.requesterId}`}
                      name={r.requesterName}
                      image={r.requesterImage}
                      date={r.createdAt}
                      actions={
                        <>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleApprove(r)}
                          >
                            {t("notifications.requests.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleReject(r)}
                          >
                            {t("notifications.requests.reject")}
                          </Button>
                        </>
                      }
                    />
                  ))
                )
              ) : approvedList.length === 0 ? (
                <p className="p-6 text-center text-sm text-bpim-muted">
                  {t("viewPermissions.empty.approved")}
                </p>
              ) : (
                approvedList.map((f) => (
                  <PermissionRow
                    key={f.followerId}
                    name={f.followerName}
                    image={f.followerImage}
                    date={f.approvedAt}
                    actions={
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs"
                        onClick={() => setRevokeTarget(f)}
                      >
                        {t("viewPermissions.revoke")}
                      </Button>
                    }
                  />
                ))
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ActionConfirmDialog
        isOpen={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title={t("viewPermissions.revokeConfirm.title")}
        description={`${revokeTarget?.followerName ?? ""}${t("viewPermissions.revokeConfirm.desc")}`}
        confirmLabel={t("viewPermissions.revoke")}
        isDestructive
        isLoading={isRevoking}
      />
    </>
  );
}
