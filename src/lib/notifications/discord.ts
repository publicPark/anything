export type DiscordPayload = { 
  content: string;
  username?: string;
  avatar_url?: string;
};

export async function postToDiscord(
  webhookUrl: string,
  payload: DiscordPayload
): Promise<void> {
  const attemptSend = async (): Promise<void> => {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Discord error ${res.status}`);
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

export function formatReservationDiscordText(
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
  return `**${roomName}** 예약 알림\n📅 ${dateStr} ${start}~${end}\n📝 ${purpose}`;
}

export type ComposeReservationDiscordParams = {
  roomName: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
  shipPublicId?: string;
  linkLabel?: string;
};

export function composeReservationDiscordText(
  params: ComposeReservationDiscordParams
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
  let content = formatReservationDiscordText(
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
      content = `${content}\n🔗 [${linkLabel}](${cabinsUrl})`;
    }
  }
  return content;
}
