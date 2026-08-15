import { NextApiResponse } from "next";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { parseBody } from "@/services/nextRequest/parseBody";
import { followRequestSubmitSchema } from "@/schemas/followRequests/submit";
import { submitFollowRequest } from "@/lib/db/orchestrators/followRequestSubmission";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = parseBody(followRequestSubmitSchema, req.body, res);
  if (!body) return;

  try {
    const result = await submitFollowRequest(req.authUid, body.token);

    switch (result.status) {
      case "requested":
        return res.status(201).json({ status: "requested" });
      case "followed":
        return res.status(200).json({ status: "followed" });
      case "self":
        return res
          .status(400)
          .json({ message: "You cannot follow yourself" });
      case "invalid_token":
        return res.status(404).json({ message: "Invalid invite link" });
      case "target_not_found":
        return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Follow Request Submit API Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
