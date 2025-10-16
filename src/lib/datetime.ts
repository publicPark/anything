export function pickLocaleFromTimeZone(timeZone: string): string | null {
  if (timeZone === "Asia/Seoul") return "ko-KR";
  if (timeZone.startsWith("America/")) return "en-US";
  if (timeZone.startsWith("Europe/")) return "en-GB";
  if (timeZone === "Asia/Tokyo") return "ja-JP";
  if (timeZone === "Asia/Shanghai") return "zh-CN";
  if (timeZone === "Asia/Hong_Kong") return "zh-HK";
  if (timeZone === "Asia/Taipei") return "zh-TW";
  if (timeZone === "Asia/Kolkata") return "en-IN";
  if (timeZone === "Australia/Sydney" || timeZone === "Pacific/Auckland")
    return "en-AU";
  return null;
}

export function formatDateForTimezone(
  dateISO: string,
  timeZone: string
): string {
  const date = new Date(dateISO);
  // Korea: YY-MM-DD
  if (timeZone === "Asia/Seoul") {
    const parts = new Intl.DateTimeFormat("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value || "";
    const m = parts.find((p) => p.type === "month")?.value || "";
    const d = parts.find((p) => p.type === "day")?.value || "";
    return `${y}-${m}-${d}`;
  }

  // Other: locale-friendly based on timezone
  const derivedLocale = pickLocaleFromTimeZone(timeZone);
  if (derivedLocale) {
    return new Intl.DateTimeFormat(derivedLocale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone,
    }).format(date);
  }

  // Fallback: ISO YYYY-MM-DD
  const isoParts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const yyyy = isoParts.find((p) => p.type === "year")?.value || "";
  const mm = isoParts.find((p) => p.type === "month")?.value || "";
  const dd = isoParts.find((p) => p.type === "day")?.value || "";
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeForTimezone(
  dateISO: string,
  timeZone: string
): string {
  return new Date(dateISO)
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    })
    .replace(/\s/g, "");
}
