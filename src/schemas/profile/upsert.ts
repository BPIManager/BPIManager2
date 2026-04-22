import { z } from "zod";

const userNameSchema = z
  .string()
  .min(2, "ユーザー名は2文字以上20文字以内で入力してください")
  .max(20, "ユーザー名は2文字以上20文字以内で入力してください")
  .refine(
    (v) => !/[/\\?#%*:"'<>|]/.test(v),
    "使用できない記号（/ や \\ など）が含まれています",
  )
  .refine(
    (v) => /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s._-]+$/.test(v),
    "名前に使用できない特殊な文字が含まれています",
  );

export const profileUpsertSchema = z.object({
  userName: userNameSchema,
  iidxId: z.string().nullable().default(null),
  profileText: z.string().nullable().default(null),
  profileImage: z.string().nullable().default(null),
  isPublic: z.number().int().min(0).max(1),
  arenaRank: z.string().nullable().default(null),
  xId: z.string().nullable().default(null),
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
