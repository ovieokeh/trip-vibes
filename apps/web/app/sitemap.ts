import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const locales = ["en", "de", "el", "es", "nl"];

  const routes = ["", "/saved", "/privacy", "/terms"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "monthly",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
