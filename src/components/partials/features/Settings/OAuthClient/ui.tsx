"use client";

import { useState } from "react";
import { useOAuthClient } from "@/hooks/users/useOAuthClient";
import { ActionConfirmDialog } from "@/components/partials/modal/Confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { KeyRound, Copy, RefreshCw, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTranslation } from "@/hooks/common/useTranslation";

const MCP_ENDPOINT_URL = "https://bpi2.poyashi.me/api/mcp";

function parseRedirectUris(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((uri) => uri.trim())
    .filter(Boolean);
}

export default function OAuthClientUi() {
  const { clientInfo, issue, remove, isLoading } = useOAuthClient();
  const [redirectUrisInput, setRedirectUrisInput] = useState("");
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [isReissueConfirmOpen, setIsReissueConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { t } = useTranslation();

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const executeIssue = async () => {
    const redirectUris = parseRedirectUris(redirectUrisInput);
    if (redirectUris.length === 0) {
      toast.error(t("settings.oauthClient.redirectUriRequired"));
      return;
    }

    try {
      const result = await issue(redirectUris);
      setIssuedSecret(result.clientSecret);
      toast.success(t("settings.oauthClient.issued"), { duration: 10000 });
      setIsReissueConfirmOpen(false);
    } catch {
      toast.error(t("settings.oauthClient.failed"));
    }
  };

  const handleIssueClick = () => {
    if (clientInfo?.exists) {
      setIsReissueConfirmOpen(true);
    } else {
      executeIssue();
    }
  };

  const executeDelete = async () => {
    try {
      await remove();
      setIssuedSecret(null);
      setRedirectUrisInput("");
      toast.success(t("settings.oauthClient.deleted"));
      setIsDeleteConfirmOpen(false);
    } catch {
      toast.error(t("settings.oauthClient.failed"));
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-xl border border-bpim-border bg-bpim-bg p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-bpim-primary">
          <KeyRound className="h-4 w-4" />
          <span className="font-bold">{t("settings.oauthClient.title")}</span>
        </div>
        <p className="text-sm text-bpim-muted">
          {t("settings.oauthClient.desc")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-bpim-muted">
          {t("settings.oauthClient.mcpEndpointLabel")}
        </span>
        <div className="flex w-full items-center md:w-112.5">
          <Input
            value={MCP_ENDPOINT_URL}
            readOnly
            className="h-9 flex-1 rounded-r-none border-bpim-border bg-bpim-bg/40 font-mono text-xs focus-visible:ring-0"
          />
          <Button
            variant="secondary"
            className="h-9 rounded-l-none border-y border-r border-bpim-border px-3 hover:bg-bpim-overlay"
            onClick={() =>
              copyToClipboard(
                MCP_ENDPOINT_URL,
                t("settings.oauthClient.copied"),
              )
            }
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-bpim-muted">
          {t("settings.oauthClient.redirectUriLabel")}
        </span>
        <Textarea
          value={redirectUrisInput}
          onChange={(e) => setRedirectUrisInput(e.target.value)}
          placeholder={t("settings.oauthClient.redirectUriPlaceholder")}
          className="min-h-16 w-full md:w-112.5 border-bpim-border bg-bpim-bg/40 font-mono text-xs"
        />
      </div>

      {(clientInfo?.exists || issuedSecret) && (
        <div className="flex flex-col gap-3 rounded-lg border border-bpim-border p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-bpim-muted">
              {t("settings.oauthClient.clientIdLabel")}
            </span>
            <div className="flex w-full items-center md:w-112.5">
              <Input
                value={clientInfo?.clientId ?? ""}
                readOnly
                className="h-9 flex-1 rounded-r-none border-bpim-border bg-bpim-bg/40 font-mono text-xs focus-visible:ring-0"
              />
              <Button
                variant="secondary"
                className="h-9 rounded-l-none border-y border-r border-bpim-border px-3 hover:bg-bpim-overlay"
                onClick={() =>
                  clientInfo?.clientId &&
                  copyToClipboard(
                    clientInfo.clientId,
                    t("settings.oauthClient.copied"),
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-bpim-muted">
              {t("settings.oauthClient.clientSecretLabel")}
            </span>
            <div className="flex w-full items-center md:w-112.5">
              <Input
                value={issuedSecret || clientInfo?.maskedSecret || ""}
                readOnly
                className="h-9 flex-1 rounded-r-none border-bpim-border bg-bpim-bg/40 font-mono text-xs focus-visible:ring-0"
              />
              {issuedSecret && (
                <Button
                  variant="secondary"
                  className="h-9 rounded-l-none border-y border-r border-bpim-border px-3 hover:bg-bpim-overlay"
                  onClick={() =>
                    copyToClipboard(
                      issuedSecret,
                      t("settings.oauthClient.copied"),
                    )
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            {issuedSecret && (
              <p className="text-[10px] font-bold text-bpim-warning">
                {t("settings.oauthClient.warning")}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          className="h-9 px-6 font-bold"
          disabled={isLoading}
          onClick={handleIssueClick}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : clientInfo?.exists ? (
            <RefreshCw className="mr-1 h-3 w-3" />
          ) : null}
          {clientInfo?.exists
            ? t("settings.oauthClient.reissue")
            : t("settings.oauthClient.issue")}
        </Button>

        {clientInfo?.exists && (
          <Button
            variant="outline"
            className="h-9 px-6 font-bold text-bpim-danger"
            disabled={isLoading}
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {t("settings.oauthClient.delete")}
          </Button>
        )}
      </div>

      <ActionConfirmDialog
        isOpen={isReissueConfirmOpen}
        onClose={() => setIsReissueConfirmOpen(false)}
        onConfirm={executeIssue}
        isLoading={isLoading}
        title={t("settings.oauthClient.reissueDialogTitle")}
        description={t("settings.oauthClient.reissueDialogDesc")}
        confirmLabel={t("common.reissue")}
        isDestructive
      />

      <ActionConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        isLoading={isLoading}
        title={t("settings.oauthClient.deleteDialogTitle")}
        description={t("settings.oauthClient.deleteDialogDesc")}
        confirmLabel={t("settings.oauthClient.delete")}
        isDestructive
      />
    </div>
  );
}
