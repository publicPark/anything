"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  sendReservationNotification,
  updateReservationNotification,
  deleteReservationNotification,
} from "@/lib/notifications";
import { t } from "@/lib/i18n";

type CreateReservationInput = {
  cabinId: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
};

export async function createReservationAction(input: CreateReservationInput) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("create_cabin_reservation", {
    cabin_uuid: input.cabinId,
    reservation_start_time: input.startISO,
    reservation_end_time: input.endISO,
    reservation_purpose: input.purpose.trim(),
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  after(async () => {
    try {
      const { data: reservation } = await supabase
        .from("cabin_reservations")
        .select("id")
        .eq("cabin_id", input.cabinId)
        .eq("start_time", input.startISO)
        .eq("end_time", input.endISO)
        .eq("purpose", input.purpose.trim())
        .single();

      if (!reservation) return;

      const { data: cabin } = await supabase
        .from("ship_cabins")
        .select("name, ship_id")
        .eq("id", input.cabinId)
        .single();

      if (!cabin) return;

      const { data: ship } = await supabase
        .from("ships")
        .select("name, public_id")
        .eq("id", cabin.ship_id)
        .single();

      if (!ship) return;

      // ship_notifications 테이블에서 활성화된 알림 설정 조회 (새 필드 포함)
      const { data: notifications } = await supabase
        .from("ship_notifications")
        .select("channel, webhook_url, slack_bot_token, slack_channel_id")
        .eq("ship_id", cabin.ship_id)
        .eq("enabled", true);

      if (!notifications || notifications.length === 0) return;

      const roomName = cabin.name || ship.name || "Room";

      // 통합 알림 시스템 사용 (새 필드 포함)
      const notificationConfig = {
        slack: (() => {
          const slackNotif = notifications.find((n) => n.channel === "slack");
          if (slackNotif) {
            return {
              webhookUrl: slackNotif.webhook_url || undefined,
              botToken: slackNotif.slack_bot_token || undefined,
              channelId: slackNotif.slack_channel_id || undefined,
            };
          }
          return undefined;
        })(),
        discord: notifications.find((n) => n.channel === "discord")?.webhook_url
          ? {
              webhookUrl: notifications.find((n) => n.channel === "discord")!
                .webhook_url,
            }
          : undefined,
      };

      // Slack 또는 Discord 웹훅이 하나라도 있으면 알림 전송
      if (notificationConfig.slack || notificationConfig.discord) {
        console.log("Sending reservation notification:", {
          roomName,
          startISO: input.startISO,
          endISO: input.endISO,
          purpose: input.purpose,
          hasSlackBotToken: !!notificationConfig.slack?.botToken,
          hasSlackChannelId: !!notificationConfig.slack?.channelId,
        });

        const { slackTs } = await sendReservationNotification(
          notificationConfig,
          {
            roomName,
            startISO: input.startISO,
            endISO: input.endISO,
            purpose: input.purpose,
            locale: input.locale,
            shipPublicId: ship.public_id,
            linkLabel: t("ships.viewStatus", input.locale),
          }
        );

        console.log("Notification sent, slackTs:", slackTs);

        // Slack 메시지 ts가 있으면 데이터베이스에 저장
        if (slackTs) {
          console.log("Updating reservation with slack_message_ts:", slackTs);
          const { error: updateError } = await supabase
            .from("cabin_reservations")
            .update({ slack_message_ts: slackTs })
            .eq("id", reservation.id);

          if (updateError) {
            console.error("Failed to update slack_message_ts:", updateError);
          } else {
            console.log("slack_message_ts updated successfully");
          }
        }
      }
    } catch (e) {
      console.error("Notification failed", e);
    }
  });

  return { ok: true as const };
}

export async function updateReservationSlackMessage(
  reservationId: string,
  startISO: string,
  endISO: string,
  purpose: string,
  cabinId: string
) {
  const supabase = await createServerSupabase();

  try {
    // 예약 정보 조회 (ts 확인)
    const { data: reservation } = await supabase
      .from("cabin_reservations")
      .select("slack_message_ts")
      .eq("id", reservationId)
      .single();

    if (!reservation?.slack_message_ts) {
      console.log("No slack message ts found, skipping update");
      return;
    }

    // Cabin 정보 조회
    const { data: cabin } = await supabase
      .from("ship_cabins")
      .select("name, ship_id")
      .eq("id", cabinId)
      .single();

    if (!cabin) return;

    // Ship 정보 조회
    const { data: ship } = await supabase
      .from("ships")
      .select("name, public_id")
      .eq("id", cabin.ship_id)
      .single();

    if (!ship) return;

    // 알림 설정 조회
    const { data: notifications } = await supabase
      .from("ship_notifications")
      .select("channel, webhook_url, slack_bot_token, slack_channel_id")
      .eq("ship_id", cabin.ship_id)
      .eq("enabled", true);

    if (!notifications) return;

    const slackNotif = notifications.find((n) => n.channel === "slack");
    if (!slackNotif?.slack_bot_token || !slackNotif?.slack_channel_id) {
      console.log("Slack bot config missing");
      return;
    }

    const notificationConfig = {
      slack: {
        webhookUrl: slackNotif.webhook_url || undefined,
        botToken: slackNotif.slack_bot_token,
        channelId: slackNotif.slack_channel_id,
      },
    };

    const roomName = `${ship.name} ${cabin.name}`;

    // Slack 메시지 업데이트
    await updateReservationNotification(notificationConfig, {
      roomName,
      startISO,
      endISO,
      purpose,
      locale: "ko",
      shipPublicId: ship.public_id,
      linkLabel: "상태 보기",
      messageTs: reservation.slack_message_ts,
    });

    console.log("Slack message updated successfully");
  } catch (error) {
    console.error("Failed to update Slack message:", error);
  }
}

export async function deleteReservationSlackMessage(
  messageTs: string,
  cabinId: string
) {
  console.log("🗑️ deleteReservationSlackMessage called:", {
    messageTs,
    cabinId,
  });

  const supabase = await createServerSupabase();

  try {
    if (!messageTs) {
      console.log("❌ No slack message ts provided, skipping delete");
      return;
    }

    console.log("✅ Message ts found, proceeding with delete");

    // Cabin 정보 조회
    const { data: cabin } = await supabase
      .from("ship_cabins")
      .select("ship_id")
      .eq("id", cabinId)
      .single();

    if (!cabin) return;

    // 알림 설정 조회
    const { data: notifications } = await supabase
      .from("ship_notifications")
      .select("channel, webhook_url, slack_bot_token, slack_channel_id")
      .eq("ship_id", cabin.ship_id)
      .eq("enabled", true);

    if (!notifications) return;

    const slackNotif = notifications.find((n) => n.channel === "slack");
    if (!slackNotif?.slack_bot_token || !slackNotif?.slack_channel_id) {
      console.log("Slack bot config missing");
      return;
    }

    const notificationConfig = {
      slack: {
        webhookUrl: slackNotif.webhook_url || undefined,
        botToken: slackNotif.slack_bot_token,
        channelId: slackNotif.slack_channel_id,
      },
    };

    // Slack 메시지 삭제
    await deleteReservationNotification(notificationConfig, messageTs);

    console.log("Slack message deleted successfully");
  } catch (error) {
    console.error("Failed to delete Slack message:", error);
  }
}
