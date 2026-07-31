import type { GetServerSideProps } from "next";

// IIDX-Scraping-Bookmarklet の main ブランチ最新コミットに追従すると、
// 参照先リポジトリが侵害された場合に未検証のコードを配信してしまうため、
// 特定コミットに固定する。更新する場合はこのSHAを明示的に書き換えること。
const BOOKMARKLET_SOURCE_COMMIT = "4bed7f19317d5b1c98037b60eac8b5b72f71d6c1";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "application/javascript");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return { props: {} };
  }

  const script = await fetch(
    `https://raw.githubusercontent.com/BPIManager/IIDX-Scraping-Bookmarklet/${BOOKMARKLET_SOURCE_COMMIT}/dist/bookmarklet.min.js`,
  );
  const body = await script.text();

  res.write(body);
  res.end();

  return { props: {} };
};

export default function BookmarkletPage() {
  return null;
}
