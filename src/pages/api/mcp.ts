import { NextApiRequest, NextApiResponse } from "next";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import dayjs from "@/lib/dayjs";
import { logsRepo } from "@/lib/db/logs";
import { oauthRepo } from "@/lib/db/oauth";
import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { scoresQuerySchema } from "@/schemas/scores/query";
import { mapToFlatSong } from "@/utils/logs/getMapFlatten";
import { filterSongsServerSide } from "@/utils/songs/filter";
import { sortSongs } from "@/utils/songs/sort";

function getBaseUrl() {
  return (process.env.BASEURL ?? "").replace(/\/+$/, "");
}

async function resolveUserIdFromBearerToken(
  req: NextApiRequest,
): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice("Bearer ".length);
  const tokenRecord = await oauthRepo.findAccessToken(accessToken);

  return tokenRecord?.userId ?? null;
}

function createMcpServer(userId: string) {
  const server = new McpServer({ name: "bpim2", version: "1.0.0" });

  server.registerTool(
    "get_my_scores",
    {
      title: "自分のスコア一覧を取得",
      description:
        "認証済みユーザー自身のbeatmania IIDXスコア一覧を取得する。バージョン・クリア状況・BPI範囲等での絞り込みが可能。",
      inputSchema: scoresQuerySchema.shape,
    },
    async ({ version, asOf, ...filterParams }) => {
      const time =
        !asOf || asOf === "latest"
          ? dayjs.tz().utc().toDate()
          : dayjs.tz(asOf).utc().toDate();

      const results = await logsRepo.getScoresWithDetails(userId, version, {
        targetTime: time,
      });

      const songs = results.map(mapToFlatSong);
      const processed = sortSongs(
        filterSongsServerSide(songs, filterParams),
        filterParams,
      );

      return {
        content: [{ type: "text", text: JSON.stringify(processed) }],
      };
    },
  );

  return server;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const userId = await resolveUserIdFromBearerToken(req);
  if (!userId) {
    res.setHeader(
      "WWW-Authenticate",
      `Bearer resource_metadata="${getBaseUrl()}/.well-known/oauth-protected-resource"`,
    );
    return res.status(401).json({ message: "Invalid or missing access token" });
  }

  // ステートレスモード: リクエストごとにサーバー/トランスポートを使い捨てる
  // (Next.jsのサーバーレス実行環境ではプロセスをまたいだセッション状態を持てないため)
  const server = createMcpServer(userId);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error: unknown) {
    console.error("MCP Server Error:", error);
    if (!res.headersSent) {
      const errorMessage =
        error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ message: errorMessage });
    }
  }
}

export default withRateLimit(handler, { windowMs: 60_000, max: 60 });
