export const OGP_SECTION_KEYS = ["topSongs", "radar", "growth", "arena"] as const;

export type OgpSectionKey = (typeof OGP_SECTION_KEYS)[number];

export const DEFAULT_OGP_SECTIONS: [OgpSectionKey, OgpSectionKey] = [
  "topSongs",
  "radar",
];

/**
 * OGP画像に載せる2項目の選択をURLクエリ（カンマ区切り）からパースする。
 * OGPはSNSクローラー向けのエンドポイントで、不正な入力で画像生成自体を
 * 落とすより既定の組み合わせにフォールバックする方が安全なため、
 * 不正/未指定時は常に`DEFAULT_OGP_SECTIONS`を返す（エラーを投げない）。
 */
export function parseOgpSections(
  raw: string | undefined,
): [OgpSectionKey, OgpSectionKey] {
  if (!raw) return DEFAULT_OGP_SECTIONS;
  const keys = [...new Set(raw.split(","))].filter((k): k is OgpSectionKey =>
    (OGP_SECTION_KEYS as readonly string[]).includes(k),
  );
  if (keys.length !== 2) return DEFAULT_OGP_SECTIONS;
  return [keys[0], keys[1]];
}
