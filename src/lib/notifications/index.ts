import {
  postToSlack,
  postSlackMessage,
  updateSlackMessage,
  deleteSlackMessage,
  composeReservationSlackText,
} from "./slack";
import { postToDiscord, composeReservationDiscordText } from "./discord";
import {
  NotificationChannel,
  NotificationConfig,
  ReservationNotificationParams,
  UpdateReservationNotificationParams,
  SendNotificationResult,
} from "@/types/notifications";

// 예약 메시지 핸들러 클래스 - 메시지 CRUD 로직을 담당
export class ReservationMessageHandler {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  async sendNotification(
    params: ReservationNotificationParams
  ): Promise<SendNotificationResult> {
    const promises: Promise<string | void>[] = [];
    let slackTs: string | undefined;

    // Slack 알림 전송
    const slackResult = await this.sendSlackNotification(params);
    if (slackResult.ts) {
      slackTs = slackResult.ts;
    }

    // Discord 알림 전송
    if (this.config.discord?.webhookUrl) {
      const discordContent = composeReservationDiscordText(params);
      promises.push(
        postToDiscord(this.config.discord.webhookUrl, {
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

  private async sendSlackNotification(
    params: ReservationNotificationParams
  ): Promise<{ ts?: string }> {
    // Bot token과 채널 ID가 있으면 API 사용 (webhook 불필요)
    if (this.config.slack?.botToken && this.config.slack?.channelId) {
      const slackText = composeReservationSlackText(params);
      try {
        const ts = await postSlackMessage(
          this.config.slack.botToken,
          this.config.slack.channelId,
          slackText
        );
        console.log("✅ Slack API message sent successfully, ts:", ts);
        return { ts };
      } catch (error) {
        console.error("❌ Slack API notification failed:", error);

        // API 실패 시 webhook으로 fallback (있는 경우)
        if (this.config.slack?.webhookUrl) {
          console.log("🔄 Falling back to webhook...");
          try {
            await postToSlack(this.config.slack.webhookUrl, {
              text: slackText,
            });
            console.log("✅ Webhook fallback successful (no ts available)");
          } catch (webhookError) {
            console.error("❌ Webhook fallback also failed:", webhookError);
          }
        } else {
          console.warn("⚠️ No fallback available - message not sent");
        }
        return {};
      }
    } else if (this.config.slack?.webhookUrl) {
      // API 설정이 없으면 webhook 사용
      const slackText = composeReservationSlackText(params);
      try {
        await postToSlack(this.config.slack.webhookUrl, { text: slackText });
      } catch (error) {
        console.error("Slack webhook notification failed:", error);
      }
      return {};
    }

    return {};
  }

  async updateNotification(
    params: UpdateReservationNotificationParams
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack 메시지 업데이트
    if (
      this.config.slack?.botToken &&
      this.config.slack?.channelId &&
      params.messageTs
    ) {
      console.log("🔄 Updating Slack message:", {
        channelId: this.config.slack.channelId,
        messageTs: params.messageTs,
        hasBotToken: !!this.config.slack.botToken,
      });
      const slackText = composeReservationSlackText(params);
      console.log("📝 New message text:", slackText);

      promises.push(
        updateSlackMessage(
          this.config.slack.botToken,
          this.config.slack.channelId,
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
    if (this.config.discord?.webhookUrl && params.messageTs) {
      console.warn(
        "Discord message update not yet implemented. Skipping update."
      );
    }

    await Promise.allSettled(promises);
  }

  async deleteNotification(messageTs: string): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack 메시지 삭제
    if (this.config.slack?.botToken && this.config.slack?.channelId) {
      console.log("🗑️ Deleting Slack message:", {
        channelId: this.config.slack.channelId,
        messageTs: messageTs,
        hasBotToken: !!this.config.slack.botToken,
      });

      promises.push(
        deleteSlackMessage(
          this.config.slack.botToken,
          this.config.slack.channelId,
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
    if (this.config.discord?.webhookUrl) {
      console.warn(
        "Discord message delete not yet implemented. Skipping delete."
      );
    }

    await Promise.allSettled(promises);
  }
}

// 레거시 함수들 - 하위 호환성을 위해 유지
export async function sendReservationNotification(
  config: NotificationConfig,
  params: ReservationNotificationParams
): Promise<{ slackTs?: string }> {
  const handler = new ReservationMessageHandler(config);
  return handler.sendNotification(params);
}

export async function updateReservationNotification(
  config: NotificationConfig,
  params: UpdateReservationNotificationParams
): Promise<void> {
  const handler = new ReservationMessageHandler(config);
  return handler.updateNotification(params);
}

export async function deleteReservationNotification(
  config: NotificationConfig,
  messageTs: string
): Promise<void> {
  const handler = new ReservationMessageHandler(config);
  return handler.deleteNotification(messageTs);
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
