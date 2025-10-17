import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl() || "https://bookabin.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
