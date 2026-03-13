import { db } from "@/lib/db";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { validateUserName } from "@/utils/common/nameValidation";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  const { name } = req.query;
  const userName = String(name);

  const validation = validateUserName(userName);
  if (!validation.isValid) {
    return res
      .status(200)
      .json({ available: false, message: validation.message });
  }

  try {
    const user = await db
      .selectFrom("users")
      .select("userId")
      .where("userName", "=", userName)
      .executeTakeFirst();

    return res.status(200).json({
      available: !user,
      message: user ? "この名前は既に使用されています" : null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
