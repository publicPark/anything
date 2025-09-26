import { Metadata } from "next";
import { Locale, getTranslations } from "./i18n";

/**
 * Generate metadata for a specific locale
 */
export function generateMetadata(locale: Locale, path?: string): Metadata {
  const t = getTranslations(locale);
  const metadata = t.metadata;

  // Generate page-specific title if path is provided
  let title = metadata.title;
  let description = metadata.description;

  if (path) {
    const pathTranslations = getPathTranslations(locale, path);
    if (pathTranslations) {
      title = `${pathTranslations.title} - ${metadata.title}`;
      description = pathTranslations.description || metadata.description;
    }
  }

  return {
    title,
    description,
    keywords: metadata.keywords,
    authors: [{ name: metadata.author }],
    creator: metadata.author,
    publisher: metadata.author,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      url: `https://your-domain.com/${locale}${path || ""}`,
      title: metadata.ogTitle,
      description: metadata.ogDescription,
      siteName: metadata.title,
      images: [
        {
          url: metadata.ogImage,
          width: 1200,
          height: 630,
          alt: metadata.ogTitle,
        },
      ],
    },
    twitter: {
      card: metadata.twitterCard as "summary_large_image",
      title: metadata.twitterTitle,
      description: metadata.twitterDescription,
      images: [metadata.ogImage],
    },
    alternates: {
      canonical: `https://your-domain.com/${locale}${path || ""}`,
      languages: {
        ko: `https://your-domain.com/ko${path || ""}`,
        en: `https://your-domain.com/en${path || ""}`,
      },
    },
    other: {
      "apple-mobile-web-app-title": metadata.title,
      "application-name": metadata.title,
      "msapplication-TileColor": "#3b82f6",
      "theme-color": "#3b82f6",
    },
  };
}

/**
 * Get path-specific translations
 */
function getPathTranslations(locale: Locale, path: string) {
  const t = getTranslations(locale);

  // Map paths to translation keys
  const pathMap: Record<string, string> = {
    "/": "home",
    "/login": "login",
    "/profile": "profile",
    "/settings": "settings",
    "/ships": "ships",
    "/ship": "ship",
  };

  const translationKey = pathMap[path];
  if (!translationKey) return null;

  const pathTranslations = t[translationKey as keyof typeof t];
  if (!pathTranslations || typeof pathTranslations !== "object") return null;

  return {
    title:
      (pathTranslations as { title?: string; name?: string }).title ||
      (pathTranslations as { title?: string; name?: string }).name,
    description: (pathTranslations as { description?: string }).description,
  };
}

/**
 * Generate static metadata for all locales and paths
 */
export function generateStaticMetadata() {
  const locales: Locale[] = ["ko", "en"];
  const paths = ["/", "/login", "/profile", "/settings", "/ships"];

  const metadata: Record<string, Metadata> = {};

  locales.forEach((locale) => {
    paths.forEach((path) => {
      const key = `${locale}${path}`;
      metadata[key] = generateMetadata(locale, path);
    });
  });

  return metadata;
}
