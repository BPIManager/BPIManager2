import { z } from "zod";
import { LINKABLE_PROVIDER_IDS } from "@/types/auth/linkedAccounts";
import { isValidEmail } from "@/utils/common/email";

/** メールアドレスを受け取る body の検証スキーマ（検証とエラー応答の原因提示は、ここの定義から出す） */
export const emailBodySchema = z.object({
  email: z
    .string("email is required")
    .refine(isValidEmail, "email must be a valid email address"),
});

/** 連携を解除できるログイン手段（パスパラメータ providerId） */
export const linkableProviderSchema = z.object({
  providerId: z.enum(LINKABLE_PROVIDER_IDS, {
    error: `providerId must be one of ${LINKABLE_PROVIDER_IDS.join(", ")}`,
  }),
});
