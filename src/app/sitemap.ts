import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://your-domain.com"; // Replace with your actual domain
  const paths = ["/", "/login", "/profile", "/settings"];

  const sitemap: MetadataRoute.Sitemap = [];

  // Generate sitemap entries for each locale and path
  locales.forEach((locale) => {
    paths.forEach((path) => {
      sitemap.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "/" ? 1.0 : 0.8,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko${path}`,
            en: `${baseUrl}/en${path}`,
          },
        },
      });
    });
  });

  return sitemap;
}
