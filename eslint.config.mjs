import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // `scripts/` は .gitignore 済みのローカル専用スクリプト置き場。CI の
    // チェックアウトには存在しないため、ローカルの `pnpm lint` を CI と
    // 揃える意味でも lint 対象から外す。
    "scripts/**",
  ]),
]);

export default eslintConfig;
