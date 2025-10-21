export type SlackPayload = { text: string };

export type SlackUpdatePayload = {
  channel: string;
  ts: string;
  text: string;
};

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

// Slack API를 사용한 메시지 전송 (ts 반환)
export async function postSlackMessage(
  botToken: string,
  channelId: string,
  text: string
): Promise<string> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      text: text,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.ts; // 메시지 timestamp 반환
}

// Slack API를 사용한 메시지 수정
export async function updateSlackMessage(
  botToken: string,
  channelId: string,
  messageTs: string,
  text: string
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      ts: messageTs,
      text: text,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}

import { formatDateForTimezone, formatTimeForTimezone } from "@/lib/datetime";

// Slack 메시지 삭제 (채널/ts 기반)
export async function deleteSlackMessage(
  botToken: string,
  channelId: string,
  messageTs: string
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      ts: messageTs,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}

export function formatReservationSlackText(
  roomName: string,
  startISO: string,
  endISO: string,
  purpose: string,
  locale: "ko" | "en",
  timeZone: string = "Asia/Seoul"
): string {
  const dateStr = formatDateForTimezone(startISO, timeZone);
  const start = formatTimeForTimezone(startISO, timeZone);
  const end = formatTimeForTimezone(endISO, timeZone);
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
  timeZone?: string;
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
    locale,
    params.timeZone
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

// 삭제된 예약을 위한 line-through 처리된 슬랙 메시지 텍스트
// composeDeletedReservationSlackText: 더 이상 사용하지 않음
