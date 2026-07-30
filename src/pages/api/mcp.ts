import { NextApiRequest, NextApiResponse } from "next";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { withRateLimit } from "@/middlewares/api/withRateLimit";
import { createMcpServer } from "@/lib/mcp/server";
import { getBaseUrl, resolveUserIdFromBearerToken } from "@/lib/mcp/auth";
import { sendMcpInfoPage } from "@/lib/mcp/infoPage";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return sendMcpInfoPage(res);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
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
