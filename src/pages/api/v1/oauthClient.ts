import crypto from "crypto";
import { NextApiResponse } from "next";
import { oauthRepo } from "@/lib/db/domains/oauth";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { manageClientSchema } from "@/schemas/oauth";
import { parseBody } from "@/services/nextRequest/parseBody";

async function handler(
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) {
  try {
    switch (req.method) {
      case "GET": {
        const client = await oauthRepo.findClientByUserId(req.authUid);

        return res.status(200).json({
          exists: !!client,
          clientId: client?.clientId ?? null,
          maskedSecret: client?.clientSecret
            ? `****${client.clientSecret.slice(-4)}`
            : null,
          redirectUris: client?.redirectUris ?? null,
        });
      }

      case "PUT": {
        const body = parseBody(manageClientSchema, req.body, res);
        if (!body) return;

        const clientId = crypto.randomBytes(16).toString("hex");
        const clientSecret = crypto.randomBytes(32).toString("hex");

        await oauthRepo.upsertUserClient({
          userId: req.authUid,
          clientId,
          clientSecret,
          redirectUris: body.redirect_uris,
        });

        return res.status(200).json({
          clientId,
          clientSecret,
          redirectUris: body.redirect_uris,
        });
      }

      case "DELETE": {
        await oauthRepo.deleteClientByUserId(req.authUid);
        res.status(204).end();
        return;
      }

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res
          .status(405)
          .json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("OAuth Client Management Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
