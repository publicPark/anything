export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "";
  const normalized = typeof url === "string" ? url.trim() : "";
  if (!normalized) return "";
  // Ensure we have protocol
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized.replace(/\/$/, "");
  }
  return `https://${normalized.replace(/\/$/, "")}`;
}

export function getAdSensePublisherId(): string | null {
  const id = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  if (!id) return null;
  return id.startsWith("pub-") ? id : `pub-${id}`;
}
