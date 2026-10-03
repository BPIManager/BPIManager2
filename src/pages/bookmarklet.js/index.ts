import type { GetServerSideProps } from "next";

// 参照先は特定コミットに固定する。main 追従だと参照先リポジトリが侵害された場合に未検証のコードを配信してしまうため。
 // 更新時はこの SHA を明示的に書き換える。
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

  try {
    const script = await fetch(
      `https://raw.githubusercontent.com/BPIManager/IIDX-Scraping-Bookmarklet/${BOOKMARKLET_SOURCE_COMMIT}/dist/bookmarklet.min.js`,
    );
    if (!script.ok) {
      console.error("bookmarklet source fetch failed:", script.status);
      res.statusCode = 502;
      res.end();
      return { props: {} };
    }
    res.write(await script.text());
    res.end();
  } catch (error: unknown) {
    console.error("bookmarklet source fetch error:", error);
    res.statusCode = 502;
    res.end();
  }

  return { props: {} };
};

export default function BookmarkletPage() {
  return null;
}
