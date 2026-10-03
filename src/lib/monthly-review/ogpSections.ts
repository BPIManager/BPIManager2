export const OGP_SECTION_KEYS = ["topSongs", "radar", "growth", "arena"] as const;

export type OgpSectionKey = (typeof OGP_SECTION_KEYS)[number];

export const DEFAULT_OGP_SECTIONS: [OgpSectionKey, OgpSectionKey] = [
  "topSongs",
  "radar",
];

/**
 * OGP画像に載せる2項目をURLクエリ（カンマ区切り）からパースする。不正・未指定は既定の組み合わせにフォールバックし、エラーは投げない。
 * SNSクローラーが叩くため、不正入力で画像生成自体を落とさないようにする。
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
