export async function GET() {
  const res = await fetch(
    "https://raw.githubusercontent.com/BPIManager/IIDX-Scraping-Bookmarklet/refs/heads/main/dist/bookmarklet.min.js",
  );
  const body = await res.text();

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript",
    },
  });
}
