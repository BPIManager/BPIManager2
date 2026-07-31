import { db } from "@/lib/db";

interface CreateAuthorizationCodeInput {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: Date;
}

interface CreateAccessTokenInput {
  token: string;
  userId: string;
  clientId: string;
  expiresAt: Date;
}

interface UpsertUserClientInput {
  userId: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
}

/**
 * MCPサーバー(/api/mcp)向けOAuth 2.0 (Authorization Code + PKCE + Dynamic Client
 * Registration)のクライアント登録・認可コード・アクセストークンを扱うリポジトリ。
 */
class OAuthRepository {
  async registerClient(
    clientId: string,
    clientName: string | undefined,
    redirectUris: string[],
  ) {
    await db
      .insertInto("oauthClients")
      .values({
        clientId,
        clientName: clientName ?? null,
        redirectUris: JSON.stringify(redirectUris),
        createdAt: new Date(),
      })
      .execute();
  }

  async findClientById(clientId: string) {
    const row = await db
      .selectFrom("oauthClients")
      .selectAll()
      .where("clientId", "=", clientId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      ...row,
      redirectUris: JSON.parse(row.redirectUris) as string[],
    };
  }

  async findClientByUserId(userId: string) {
    const row = await db
      .selectFrom("oauthClients")
      .selectAll()
      .where("userId", "=", userId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      ...row,
      redirectUris: JSON.parse(row.redirectUris) as string[],
    };
  }

  /**
   * Settings画面から手動発行されるconfidential client(client_secret検証あり)を
   * 1ユーザーにつき1つ登録・再発行する。`userId`のUNIQUE制約により再発行時は
   * 既存行を上書きする(`apiKeysRepo.upsert`と同じ思想)。
   */
  async upsertUserClient(input: UpsertUserClientInput) {
    await db
      .insertInto("oauthClients")
      .values({
        clientId: input.clientId,
        userId: input.userId,
        clientSecret: input.clientSecret,
        redirectUris: JSON.stringify(input.redirectUris),
        createdAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        clientId: input.clientId,
        clientSecret: input.clientSecret,
        redirectUris: JSON.stringify(input.redirectUris),
      })
      .execute();
  }

  async deleteClientByUserId(userId: string) {
    await db
      .deleteFrom("oauthClients")
      .where("userId", "=", userId)
      .execute();
  }

  async createAuthorizationCode(input: CreateAuthorizationCodeInput) {
    await db
      .insertInto("oauthAuthorizationCodes")
      .values({
        code: input.code,
        userId: input.userId,
        clientId: input.clientId,
        redirectUri: input.redirectUri,
        codeChallenge: input.codeChallenge,
        codeChallengeMethod: input.codeChallengeMethod,
        expiresAt: input.expiresAt,
        createdAt: new Date(),
      })
      .execute();
  }

  /**
   * 認可コードを検証し、1回限りの使用として消費する。
   * `consumedAt`更新のUPDATE結果(numUpdatedRows)で同時多重使用を防ぐ。
   */
  async consumeAuthorizationCode(code: string) {
    const now = new Date();

    const row = await db
      .selectFrom("oauthAuthorizationCodes")
      .selectAll()
      .where("code", "=", code)
      .where("consumedAt", "is", null)
      .where("expiresAt", ">", now)
      .executeTakeFirst();

    if (!row) return null;

    const result = await db
      .updateTable("oauthAuthorizationCodes")
      .set({ consumedAt: now })
      .where("code", "=", code)
      .where("consumedAt", "is", null)
      .executeTakeFirst();

    if (result.numUpdatedRows !== 1n) return null;

    return row;
  }

  async createAccessToken(input: CreateAccessTokenInput) {
    await db
      .insertInto("oauthAccessTokens")
      .values({
        token: input.token,
        userId: input.userId,
        clientId: input.clientId,
        expiresAt: input.expiresAt,
        createdAt: new Date(),
      })
      .execute();
  }

  async findAccessToken(token: string) {
    return db
      .selectFrom("oauthAccessTokens")
      .selectAll()
      .where("token", "=", token)
      .where("expiresAt", ">", new Date())
      .executeTakeFirst();
  }
}

export const oauthRepo = new OAuthRepository();
