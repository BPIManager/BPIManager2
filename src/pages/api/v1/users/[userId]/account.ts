import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { deleteAccount } from "@/lib/subhandlers/profile";
import { err, writeV1Result } from "@/middlewares/api/apiResult";
import type { NextApiResponse } from "next";

const handler = async (
  req: AuthenticatedNextApiRequest,
  res: NextApiResponse,
) => {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return writeV1Result(res, err(405, "Method Not Allowed"));
  }
  const { result } = await deleteAccount(req, req.authUid);
  writeV1Result(res, result);
};

export default withAuth(handler, { rejectApiKeySession: true });
