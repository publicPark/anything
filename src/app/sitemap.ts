import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl() || "https://bookabin.vercel.app";
  const paths = [
    "/",
    "/login",
    "/profile",
    "/faq",
    "/ships",
    "/privacy",
    "/terms",
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Static pages
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

  // Dynamic: public ships (exclude member_only)
  try {
    const supabase = await createClient();
    const { data: ships, error } = await supabase
      .from("ships")
      .select("public_id, updated_at, member_only")
      .eq("member_only", false);

    if (!error && ships) {
      ships.forEach((ship) => {
        locales.forEach((locale) => {
          const path = `/ship/${ship.public_id}`;
          sitemap.push({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: ship.updated_at
              ? new Date(ship.updated_at)
              : new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: {
                ko: `${baseUrl}/ko${path}`,
                en: `${baseUrl}/en${path}`,
              },
            },
          });
        });
      });
    }
  } catch {
    // If DB fetch fails, return static sitemap only
  }

  return sitemap;
}
