import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "public/data/sitemaps");
const BASE_URL = process.env.BASEURL + "users";

export async function generateUserSitemap() {
  console.log("Starting sitemap generation for users...");

  try {
    const users = await db.selectFrom("users").select("userId").execute();
    console.log(`Found ${users.length} users.`);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const user of users) {
      const userUrl = `${BASE_URL}/${encodeURIComponent(user.userId)}`;

      xml += `  <url>\n`;
      xml += `    <loc>${userUrl}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filePath = path.join(OUTPUT_DIR, "users.xml");

    await fs.writeFile(filePath, xml, "utf8");

    console.log(`Sitemap successfully saved to: ${filePath}`);
    console.log(`Total URLs: ${users.length}`);
  } catch (error) {
    console.error("Failed to generate user sitemap:", error);
    throw error;
  }
}
