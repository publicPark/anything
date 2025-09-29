export type SlackPayload = { text: string };

export async function postToSlack(
  webhookUrl: string,
  payload: SlackPayload
): Promise<void> {
  const fetchWithTimeout = async (ms: number): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const attemptSend = async (timeoutMs: number): Promise<void> => {
    const res = await fetchWithTimeout(timeoutMs);
    if (!res.ok) {
      throw new Error(`Slack error ${res.status}`);
    }
  };

  // jittered backoff delays and per-attempt timeout (shorter on prod to avoid long hangs)
  const delaysMs = [500, 2000, 5000];
  const baseTimeout = 4000; // 4s per attempt
  for (let i = 0; i <= delaysMs.length; i++) {
    try {
      const jitter = Math.floor(Math.random() * 300);
      await attemptSend(baseTimeout + jitter);
      return;
    } catch (err) {
      if (i === delaysMs.length) throw err as Error;
      const jitter = Math.floor(Math.random() * 300);
      await new Promise((resolve) => setTimeout(resolve, delaysMs[i] + jitter));
    }
  }
}

export function formatReservationSlackText(
  roomName: string,
  startISO: string,
  endISO: string,
  purpose: string,
  locale: "ko" | "en"
): string {
  const date = new Date(startISO);
  const intl = locale === "ko" ? "ko-KR" : "en-US";

  const y = date
    .toLocaleDateString(intl, {
      year: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .padStart(2, "0");
  const m = date
    .toLocaleDateString(intl, {
      month: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .padStart(2, "0");
  const d = date
    .toLocaleDateString(intl, {
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
    .padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  const fmtTime = (iso: string) =>
    new Date(iso)
      .toLocaleTimeString(intl, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
      })
      .replace(/\s/g, "");

  const start = fmtTime(startISO);
  const end = fmtTime(endISO);
  return `[${roomName} / ${dateStr} / ${start}~${end}]\n>${purpose}`;
}

export type ComposeReservationMessageParams = {
  roomName: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
  shipPublicId?: string;
  linkLabel?: string;
};

export function composeReservationSlackText(
  params: ComposeReservationMessageParams
): string {
  const {
    roomName,
    startISO,
    endISO,
    purpose,
    locale,
    shipPublicId,
    linkLabel,
  } = params;
  let text = formatReservationSlackText(
    roomName,
    startISO,
    endISO,
    purpose,
    locale
  );

  if (shipPublicId && linkLabel) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (baseUrl) {
      const localePrefix = `/${locale}`;
      const cabinsUrl = `${baseUrl}${localePrefix}/ship/${shipPublicId}/cabins`;
      text = `${text}\n<${cabinsUrl}|${linkLabel}>`;
    }
  }
  return text;
}
