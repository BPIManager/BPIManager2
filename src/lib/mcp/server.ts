import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetMyScores } from "@/lib/mcp/tools/getMyScores";
import { registerSearchUsers } from "@/lib/mcp/tools/searchUsers";
import { registerGetMyFollows } from "@/lib/mcp/tools/getMyFollows";
import { registerGetUserScores } from "@/lib/mcp/tools/getUserScores";
import { registerSearchSongs } from "@/lib/mcp/tools/searchSongs";
import { registerUpdateMyScore } from "@/lib/mcp/tools/updateMyScore";
import { registerGetMyDashboard } from "@/lib/mcp/tools/getMyDashboard";
import { registerGetSongRivals } from "@/lib/mcp/tools/getSongRivals";

export function createMcpServer(userId: string) {
  const server = new McpServer({ name: "bpim2", version: "1.0.0" });

  registerGetMyScores(server, userId);
  registerSearchUsers(server);
  registerGetMyFollows(server, userId);
  registerGetUserScores(server, userId);
  registerSearchSongs(server);
  registerUpdateMyScore(server, userId);
  registerGetMyDashboard(server, userId);
  registerGetSongRivals(server, userId);

  return server;
}
