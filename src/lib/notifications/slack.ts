export type SlackPayload = { text: string };

export async function postToSlack(
  webhookUrl: string,
  payload: SlackPayload
): Promise<void> {
  const attemptSend = async (): Promise<void> => {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Slack error ${res.status}`);
    }
  };

  const delaysMs = [500, 2000, 5000];
  for (let i = 0; i <= delaysMs.length; i++) {
    try {
      await attemptSend();
      return;
    } catch (err) {
      if (i === delaysMs.length) throw err as Error;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[i]));
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

  const y = date.toLocaleDateString(intl, { 
    year: "2-digit",
    timeZone: "Asia/Seoul"
  }).padStart(2, "0");
  const m = date
    .toLocaleDateString(intl, { 
      month: "2-digit",
      timeZone: "Asia/Seoul"
    })
    .padStart(2, "0");
  const d = date.toLocaleDateString(intl, { 
    day: "2-digit",
    timeZone: "Asia/Seoul"
  }).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;

  const fmtTime = (iso: string) =>
    new Date(iso)
      .toLocaleTimeString(intl, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul"
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
