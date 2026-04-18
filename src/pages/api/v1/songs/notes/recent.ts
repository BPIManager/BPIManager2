import type { NextApiRequest, NextApiResponse } from "next";
import { songNotesRepo } from "@/lib/db/songNotes";

const PAGE_SIZE = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") return res.status(405).end();

  const sort =
    req.query.sort === "upvotes" ? "upvotes" : ("latest" as "latest" | "upvotes");

  const page = Math.max(0, parseInt(String(req.query.page ?? "0"), 10) || 0);

  const notes = await songNotesRepo.getRecentNotes(sort, PAGE_SIZE, page * PAGE_SIZE);
  return res.status(200).json(notes);
}
