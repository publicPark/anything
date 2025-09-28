import { postToSlack, composeReservationSlackText } from './slack';
import { postToDiscord, composeReservationDiscordText } from './discord';

export type NotificationChannel = 'slack' | 'discord';

export type NotificationConfig = {
  slack?: {
    webhookUrl: string;
  };
  discord?: {
    webhookUrl: string;
  };
};

export type ReservationNotificationParams = {
  roomName: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
  shipPublicId?: string;
  linkLabel?: string;
};

export async function sendReservationNotification(
  config: NotificationConfig,
  params: ReservationNotificationParams
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Slack 알림
  if (config.slack?.webhookUrl) {
    const slackText = composeReservationSlackText(params);
    promises.push(
      postToSlack(config.slack.webhookUrl, { text: slackText }).catch((error) => {
        console.error('Slack notification failed:', error);
      })
    );
  }

  // Discord 알림
  if (config.discord?.webhookUrl) {
    const discordContent = composeReservationDiscordText(params);
    promises.push(
      postToDiscord(config.discord.webhookUrl, { content: discordContent }).catch((error) => {
        console.error('Discord notification failed:', error);
      })
    );
  }

  // 모든 알림을 병렬로 전송
  await Promise.allSettled(promises);
}

export async function sendNotificationToChannel(
  channel: NotificationChannel,
  webhookUrl: string,
  params: ReservationNotificationParams
): Promise<void> {
  if (channel === 'slack') {
    const text = composeReservationSlackText(params);
    await postToSlack(webhookUrl, { text });
  } else if (channel === 'discord') {
    const content = composeReservationDiscordText(params);
    await postToDiscord(webhookUrl, { content });
  }
}
