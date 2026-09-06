import useSWRMutation from "swr/mutation";
import { useAuthedSWRV2 } from "@/hooks/common/useAuthedSWRV2";
import { useUser } from "@/contexts/users/UserContext";
import { API_V2_PREFIX } from "@/constants/logic/apiEndpoints";
import { issueOAuthClient, deleteOAuthClient } from "@/services/swr/oauthClient";

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

  const { data, mutate, isLoading } = useAuthedSWRV2<OAuthClientInfo>(
    fbUser ? `${API_V2_PREFIX}/oauthClient` : null,
  );

  const { trigger: triggerIssue, isMutating: isIssuing } = useSWRMutation(
    `${API_V2_PREFIX}/oauthClient`,
    (url, { arg }: { arg: { redirectUris: string[] } }) =>
      issueOAuthClient(url, fbUser, arg.redirectUris),
  );

  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    `${API_V2_PREFIX}/oauthClient`,
    (url) => deleteOAuthClient(url, fbUser),
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
