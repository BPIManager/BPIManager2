import type { GetServerSideProps } from "next";

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
    "https://raw.githubusercontent.com/BPIManager/IIDX-Scraping-Bookmarklet/refs/heads/main/dist/bookmarklet.min.js",
  );
  const body = await script.text();

  res.write(body);
  res.end();

  return { props: {} };
};

export default function BookmarkletPage() {
  return null;
}
