import useSWRMutation from "swr/mutation";
import { useAuthedSWR } from "@/hooks/common/useAuthedSWR";
import { useUser } from "@/contexts/users/UserContext";
import { API_PREFIX } from "@/constants/logic/apiEndpoints";

interface OAuthClientInfo {
  exists: boolean;
  clientId: string | null;
  maskedSecret: string | null;
  redirectUris: string[] | null;
}

/**
 * MCPサーバー(/api/mcp)向けOAuthクライアント(client_id/client_secret)の
 * 発行・再発行・削除を行うフック。ChatGPT等、Dynamic Client Registrationに
 * 対応していないMCPクライアントへ手動で設定するためのもの。
 */
export const useOAuthClient = () => {
  const { fbUser } = useUser();

  const { data, mutate, isLoading } = useAuthedSWR<OAuthClientInfo>(
    fbUser ? `${API_PREFIX}/oauthClient` : null,
  );

  const { trigger: triggerIssue, isMutating: isIssuing } = useSWRMutation(
    `${API_PREFIX}/oauthClient`,
    async (url, { arg }: { arg: { redirectUris: string[] } }) => {
      const token = await fbUser?.getIdToken();
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ redirect_uris: arg.redirectUris }),
      });
      if (!res.ok) throw new Error("Failed to issue OAuth client");
      return res.json();
    },
  );

  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    `${API_PREFIX}/oauthClient`,
    async (url) => {
      const token = await fbUser?.getIdToken();
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete OAuth client");
    },
  );

  return {
    clientInfo: data,
    issue: async (redirectUris: string[]) => {
      const result = await triggerIssue({ redirectUris });
      await mutate();
      return result as { clientId: string; clientSecret: string };
    },
    remove: async () => {
      await triggerDelete();
      await mutate();
    },
    isLoading: isLoading || isIssuing || isDeleting,
  };
};
