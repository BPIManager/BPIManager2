import { NextApiRequest, NextApiResponse } from "next";

function getBaseUrl() {
  return (process.env.BASEURL ?? "").replace(/\/+$/, "");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "invalid_request" });
  }

  const baseUrl = getBaseUrl();

  return res.status(200).json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
  });
}
