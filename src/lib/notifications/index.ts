import {
  postToSlack,
  postSlackMessage,
  updateSlackMessage,
  deleteSlackMessage,
  composeReservationSlackText,
} from "./slack";
import { postToDiscord, composeReservationDiscordText } from "./discord";

export type NotificationChannel = "slack" | "discord";

export type NotificationConfig = {
  slack?: {
    webhookUrl?: string;
    botToken?: string;
    channelId?: string;
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
): Promise<{ slackTs?: string }> {
  const promises: Promise<string | void>[] = [];
  let slackTs: string | undefined;

  // Slack 알림 (API 우선, webhook 없어도 API로만 전송 가능)
  if (config.slack?.botToken && config.slack?.channelId) {
    // Bot token과 채널 ID가 있으면 API 사용 (webhook 불필요)
    const slackText = composeReservationSlackText(params);
    promises.push(
      postSlackMessage(config.slack.botToken, config.slack.channelId, slackText)
        .then((ts) => {
          slackTs = ts;
          console.log("✅ Slack API message sent successfully, ts:", ts);
        })
        .catch((error) => {
          console.error("❌ Slack API notification failed:", error);

          // API 실패 시 webhook으로 fallback (있는 경우)
          if (config.slack?.webhookUrl) {
            console.log("🔄 Falling back to webhook...");
            return postToSlack(config.slack.webhookUrl, { text: slackText })
              .then(() => {
                console.log("✅ Webhook fallback successful (no ts available)");
              })
              .catch((webhookError) => {
                console.error("❌ Webhook fallback also failed:", webhookError);
              });
          } else {
            console.warn("⚠️ No fallback available - message not sent");
          }
        })
    );
  } else if (config.slack?.webhookUrl) {
    // API 설정이 없으면 webhook 사용
    const slackText = composeReservationSlackText(params);
    promises.push(
      postToSlack(config.slack.webhookUrl, { text: slackText }).catch(
        (error) => {
          console.error("Slack webhook notification failed:", error);
        }
      )
    );
  }

  // Discord 알림
  if (config.discord?.webhookUrl) {
    const discordContent = composeReservationDiscordText(params);
    promises.push(
      postToDiscord(config.discord.webhookUrl, {
        content: discordContent,
      }).catch((error) => {
        console.error("Discord notification failed:", error);
      })
    );
  }

  // 모든 알림을 병렬로 전송
  await Promise.allSettled(promises);

  return { slackTs };
}

export type UpdateReservationNotificationParams =
  ReservationNotificationParams & {
    messageTs?: string; // Slack 메시지 timestamp
  };

export async function updateReservationNotification(
  config: NotificationConfig,
  params: UpdateReservationNotificationParams
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Slack 메시지 업데이트
  if (config.slack?.botToken && config.slack?.channelId && params.messageTs) {
    console.log("🔄 Updating Slack message:", {
      channelId: config.slack.channelId,
      messageTs: params.messageTs,
      hasBotToken: !!config.slack.botToken,
    });
    const slackText = composeReservationSlackText(params);
    console.log("📝 New message text:", slackText);

    promises.push(
      updateSlackMessage(
        config.slack.botToken,
        config.slack.channelId,
        params.messageTs,
        slackText
      )
        .then(() => {
          console.log("✅ Slack message updated successfully");
        })
        .catch((error) => {
          console.error("❌ Slack message update failed:", error);
        })
    );
  } else if (params.messageTs) {
    console.warn(
      "Slack message update requires bot token and channel ID. Skipping update."
    );
  }

  // Discord 메시지 업데이트 (Discord도 메시지 수정을 지원하지만 현재 구현되지 않음)
  if (config.discord?.webhookUrl && params.messageTs) {
    console.warn(
      "Discord message update not yet implemented. Skipping update."
    );
  }

  await Promise.allSettled(promises);
}

export async function deleteReservationNotification(
  config: NotificationConfig,
  messageTs: string
): Promise<void> {
  const promises: Promise<void>[] = [];

  // Slack 메시지 삭제
  if (config.slack?.botToken && config.slack?.channelId) {
    console.log("🗑️ Deleting Slack message:", {
      channelId: config.slack.channelId,
      messageTs: messageTs,
      hasBotToken: !!config.slack.botToken,
    });

    promises.push(
      deleteSlackMessage(
        config.slack.botToken,
        config.slack.channelId,
        messageTs
      )
        .then(() => {
          console.log("✅ Slack message deleted successfully");
        })
        .catch((error) => {
          console.error("❌ Slack message delete failed:", error);
        })
    );
  } else {
    console.warn(
      "Slack message delete requires bot token and channel ID. Skipping delete."
    );
  }

  // Discord 메시지 삭제 (현재 구현되지 않음)
  if (config.discord?.webhookUrl) {
    console.warn(
      "Discord message delete not yet implemented. Skipping delete."
    );
  }

  await Promise.allSettled(promises);
}

export async function sendNotificationToChannel(
  channel: NotificationChannel,
  webhookUrl: string,
  params: ReservationNotificationParams
): Promise<void> {
  if (channel === "slack") {
    const text = composeReservationSlackText(params);
    await postToSlack(webhookUrl, { text });
  } else if (channel === "discord") {
    const content = composeReservationDiscordText(params);
    await postToDiscord(webhookUrl, { content });
  }
}
