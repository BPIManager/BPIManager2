import { usersRepo } from "@/lib/db/users";
import {
  AuthenticatedNextApiRequest,
  withAuth,
} from "@/middlewares/api/withAuth";
import { validateUserName } from "@/utils/common/nameValidation";
import type { NextApiResponse } from "next";

async function handler(req: AuthenticatedNextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  const { username } = req.query;
  const userName = String(username);

  const validation = validateUserName(userName);
  if (!validation.isValid) {
    return res.status(200).json({
      available: false,
      message: validation.message,
    });
  }

  try {
    const existingUser = await usersRepo.checkUserNameAvailability(userName);

    return res.status(200).json({
      available: !existingUser,
      message: existingUser
        ? "この名前は既に使用されています"
        : "使用可能な名前です",
    });
  } catch (error) {
    console.error("Username Availability Check Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export default withAuth(handler);
