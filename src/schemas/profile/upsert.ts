import { z } from "zod";

/** API のエラーに載せる英語のメッセージ。画面向けの日本語は nameValidation.ts で対応づける */
export const USER_NAME_MESSAGES = {
  length: "userName must be 2 to 20 characters",
  forbiddenSymbols: "userName must not contain any of / \\ ? # % * : \" ' < > |",
  invalidCharacters: "userName contains unsupported characters",
} as const;

export const userNameSchema = z
  .string()
  .min(2, USER_NAME_MESSAGES.length)
  .max(20, USER_NAME_MESSAGES.length)
  .refine(
    (v) => !/[/\\?#%*:"'<>|]/.test(v),
    USER_NAME_MESSAGES.forbiddenSymbols,
  )
  .refine(
    (v) => /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s._-]+$/.test(v),
    USER_NAME_MESSAGES.invalidCharacters,
  );

export const arenaPrivacySchema = z.object({
  showArenaClass: z.boolean().default(true),
  showArenaRank: z.boolean().default(false),
  showArea: z.boolean().default(false),
  showGrade: z.boolean().default(false),
});

export const profileUpsertSchema = z.object({
  userName: userNameSchema,
  // 8桁（ハイフン有無どちらも可。DBは varchar(12)）。未設定は空文字またはnull
  iidxId: z
    .string()
    .regex(/^(\d{4}-?\d{4})?$/, "iidxId must be 8 digits (hyphen optional)")
    .nullable()
    .default(null),
  profileText: z.string().max(2000).nullable().default(null),
  profileImage: z
    .string()
    .max(2048)
    .refine((v) => v === "" || /^https:\/\//.test(v), "profileImage must be an https URL")
    .nullable()
    .default(null),
  isPublic: z.number().int().min(0).max(1),
  xId: z.string().max(20).nullable().default(null),
  arenaPrivacy: arenaPrivacySchema.optional(),
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
