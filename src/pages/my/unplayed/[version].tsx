import type { GetServerSideProps } from "next";

/**
 * 旧「未プレイ一覧」のURL。スコア一覧の「プレイ状態=未プレイ」へ、既存のクエリ（レベル・難易度など）を引き継いでリダイレクトする。
 */
export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const version = typeof params?.version === "string" ? params.version : "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "version" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  search.set("isMyPlayed", "false");
  return {
    redirect: {
      destination: `/my/${encodeURIComponent(version)}?${search.toString()}`,
      permanent: false,
    },
  };
};

export default function UnplayedScoresRedirect() {
  return null;
}
