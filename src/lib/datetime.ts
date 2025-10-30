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

// Compute start/end of "today" in a specific IANA timezone and return ISO strings (UTC instants)
export function getStartEndOfDayISOInTimeZone(
  timeZone: string,
  reference: Date = new Date()
): { startISO: string; endISO: string } {
  // Derive Y/M/D of the reference moment in the target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  // Helper to get offset in ms for a given UTC timestamp interpreted in target timezone
  const getTimeZoneOffsetMs = (utcTs: number) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = dtf.formatToParts(new Date(utcTs));
    const year = Number(p.find((x) => x.type === "year")?.value);
    const month = Number(p.find((x) => x.type === "month")?.value);
    const day = Number(p.find((x) => x.type === "day")?.value);
    const hour = Number(p.find((x) => x.type === "hour")?.value);
    const minute = Number(p.find((x) => x.type === "minute")?.value);
    const second = Number(p.find((x) => x.type === "second")?.value);
    // Construct the same wall time in UTC to compute offset
    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUTC - utcTs;
  };

  // Target wall times: 00:00:00 of [y-m-d] and next day in the target timezone
  const wallStartUTC = Date.UTC(y, m - 1, d, 0, 0, 0);
  const wallEndUTC = Date.UTC(y, m - 1, d + 1, 0, 0, 0);

  // Adjust by the timezone offset at those instants to get true UTC instants
  const startISO = new Date(
    wallStartUTC - getTimeZoneOffsetMs(wallStartUTC)
  ).toISOString();
  const endISO = new Date(
    wallEndUTC - getTimeZoneOffsetMs(wallEndUTC)
  ).toISOString();

  return { startISO, endISO };
}

// Compute a 3-day window [yesterday 00:00, tomorrow 24:00) in the given timezone
export function getThreeDayWindowISOInTimeZone(
  timeZone: string,
  reference: Date = new Date()
): { startISO: string; endISO: string } {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const yesterday = new Date(reference.getTime() - oneDayMs);
  const tomorrow = new Date(reference.getTime() + oneDayMs);
  const { startISO: startOfYesterday } = getStartEndOfDayISOInTimeZone(
    timeZone,
    yesterday
  );
  const { endISO: endOfTomorrow } = getStartEndOfDayISOInTimeZone(
    timeZone,
    tomorrow
  );
  return { startISO: startOfYesterday, endISO: endOfTomorrow };
}

// Compute start/end of the month containing the reference date in a specific IANA timezone
export function getStartEndOfMonthISOInTimeZone(
  timeZone: string,
  reference: Date = new Date()
): { startISO: string; endISO: string } {
  // Derive year/month/day for the reference in target timezone
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);

  // Helper to compute timezone offset
  const getTimeZoneOffsetMs = (utcTs: number) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = dtf.formatToParts(new Date(utcTs));
    const year = Number(p.find((x) => x.type === "year")?.value);
    const month = Number(p.find((x) => x.type === "month")?.value);
    const day = Number(p.find((x) => x.type === "day")?.value);
    const hour = Number(p.find((x) => x.type === "hour")?.value);
    const minute = Number(p.find((x) => x.type === "minute")?.value);
    const second = Number(p.find((x) => x.type === "second")?.value);
    const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUTC - utcTs;
  };

  // Month start (day=1) at 00:00 in target tz, and next month start
  const wallStartUTC = Date.UTC(y, m - 1, 1, 0, 0, 0);
  const wallEndUTC = Date.UTC(y, m, 1, 0, 0, 0); // next month day 1

  const startISO = new Date(
    wallStartUTC - getTimeZoneOffsetMs(wallStartUTC)
  ).toISOString();
  const endISO = new Date(
    wallEndUTC - getTimeZoneOffsetMs(wallEndUTC)
  ).toISOString();
  return { startISO, endISO };
}

// Compute the visible calendar grid range for a given month in a timezone.
// The grid starts on weekStartsOn (0=Sunday, 1=Monday [default]) of the week containing the 1st,
// and ends on the day before weekStartsOn of the week after the month's last day.
export function getVisibleMonthGridRangeISOInTimeZone(
  timeZone: string,
  reference: Date = new Date(),
  weekStartsOn: 0 | 1 = 1
): { startISO: string; endISO: string } {
  // Extract Y/M/D in target timezone for the reference
  const baseParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const year = Number(baseParts.find((p) => p.type === "year")?.value);
  const month = Number(baseParts.find((p) => p.type === "month")?.value);

  // Helper to compute timezone offset (same as above)
  const getTimeZoneOffsetMs = (utcTs: number) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const p = dtf.formatToParts(new Date(utcTs));
    const y = Number(p.find((x) => x.type === "year")?.value);
    const m = Number(p.find((x) => x.type === "month")?.value);
    const d = Number(p.find((x) => x.type === "day")?.value);
    const h = Number(p.find((x) => x.type === "hour")?.value);
    const mi = Number(p.find((x) => x.type === "minute")?.value);
    const s = Number(p.find((x) => x.type === "second")?.value);
    const asUTC = Date.UTC(y, m - 1, d, h, mi, s);
    return asUTC - utcTs;
  };

  // First day of month in wall time
  const monthStartWallUTC = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const monthStartDate = new Date(monthStartWallUTC);
  // Derive weekday in target timezone (0=Sun..6=Sat)
  const weekdayInTz = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).formatToParts(monthStartDate);
  // Map weekday text to index
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const wdLabel = weekdayInTz.find((p) => p.type === "weekday")?.value ?? "Sun";
  const monthStartWday = weekdayMap[wdLabel] ?? 0;

  // Distance to go back to the grid start based on weekStartsOn
  const backDays = (7 + (monthStartWday - weekStartsOn)) % 7;
  // Start of visible grid (midnight) in wall time
  const gridStartWallUTC = Date.UTC(year, month - 1, 1 - backDays, 0, 0, 0);

  // Last day of month in wall time (day=0 of next month gives last day prev month)
  const lastDayWallUTC = Date.UTC(year, month, 0, 0, 0, 0);
  const lastDayDate = new Date(lastDayWallUTC);
  const lastWdParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).formatToParts(lastDayDate);
  const lastWdLabel =
    lastWdParts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const lastWday = weekdayMap[lastWdLabel] ?? 0;
  // Distance to go forward to the end of grid (exclusive end at next day's 00:00)
  const endDayTarget = (weekStartsOn + 7 - 1) % 7; // day before weekStartsOn
  const forwardDays = (7 + (endDayTarget - lastWday)) % 7;
  const gridEndWallUTC = Date.UTC(
    year,
    month - 1,
    new Date(lastDayWallUTC).getUTCDate() + forwardDays + 1,
    0,
    0,
    0
  );

  const startISO = new Date(
    gridStartWallUTC - getTimeZoneOffsetMs(gridStartWallUTC)
  ).toISOString();
  const endISO = new Date(
    gridEndWallUTC - getTimeZoneOffsetMs(gridEndWallUTC)
  ).toISOString();
  return { startISO, endISO };
}
