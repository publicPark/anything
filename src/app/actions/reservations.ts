"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { ReservationMessageHandler } from "@/lib/notifications";
import { ShipNotificationService } from "@/lib/services/ShipNotificationService";
import { NotificationErrorHandler } from "@/lib/utils/notification-error-handler";
import { t } from "@/lib/i18n";

type CreateReservationInput = {
  cabinId: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
  guestIdentifier?: string;
  userDisplayName?: string;
};

// 예약 생성만 하는 함수 (빠른 응답용)
export async function createReservationOnlyAction(
  input: CreateReservationInput
) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("create_cabin_reservation", {
    cabin_uuid: input.cabinId,
    reservation_start_time: input.startISO,
    reservation_end_time: input.endISO,
    reservation_purpose: input.purpose.trim(),
    guest_identifier_param: input.guestIdentifier || null,
    user_display_name_param: input.userDisplayName || null,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

// 슬랙 알림만 하는 함수 (백그라운드 처리용)
export async function sendReservationNotificationAction(
  input: CreateReservationInput
) {
  const supabase = await createServerSupabase();

  try {
    const { data: reservation } = await supabase
      .from("cabin_reservations")
      .select("id")
      .eq("cabin_id", input.cabinId)
      .eq("start_time", input.startISO)
      .eq("end_time", input.endISO)
      .eq("purpose", input.purpose.trim())
      .single();

    if (!reservation) {
      return { ok: false as const, message: "Reservation not found" };
    }

    // 서비스 인스턴스 생성
    const notificationService = new ShipNotificationService(supabase);

    // 예약 컨텍스트 조회 (cabin, ship, notification config)
    const context = await notificationService.getReservationContext(
      input.cabinId
    );

    if (!context || (!context.config.slack && !context.config.discord)) {
      return { ok: true as const, slackSent: false, discordSent: false };
    }

    console.log("Sending reservation notification:", {
      roomName: context.roomName,
      startISO: input.startISO,
      endISO: input.endISO,
      purpose: input.purpose,
      hasSlackBotToken: !!context.config.slack?.botToken,
      hasSlackChannelId: !!context.config.slack?.channelId,
      hasDiscordWebhook: !!context.config.discord?.webhookUrl,
    });

    // 메시지 핸들러로 알림 전송
    const messageHandler = new ReservationMessageHandler(context.config);
    const {
      slackTs,
      slackMethod: method,
      discordSent: discord,
    } = await messageHandler.sendNotification({
      roomName: context.roomName,
      startISO: input.startISO,
      endISO: input.endISO,
      purpose: input.purpose,
      locale: input.locale,
      shipPublicId: context.ship.publicId,
      timeZone: context.ship.timeZone,
      linkLabel: `${t("ships.viewStatus", input.locale)}`,
    });

    console.log(
      "Notification sent, slackTs:",
      slackTs,
      "slackMethod:",
      method,
      "discordSent:",
      discord
    );

    // Slack 메시지 ts가 있으면 데이터베이스에 저장
    let slackSent = false;
    let slackMethod: "bot" | "webhook" | undefined;
    let discordSent = false;

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
        slackSent = true;
        slackMethod = method;
      }
    } else if (method) {
      // ts가 없어도 전송은 성공한 경우 (webhook)
      slackSent = true;
      slackMethod = method;
    }

    // Discord 전송 결과
    if (discord) {
      discordSent = true;
    }

    return { ok: true as const, slackSent, slackMethod, discordSent };
  } catch (e) {
    console.error("Notification failed", e);
    return { ok: false as const, message: "Notification failed" };
  }
}

export async function createReservationAction(input: CreateReservationInput) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("create_cabin_reservation", {
    cabin_uuid: input.cabinId,
    reservation_start_time: input.startISO,
    reservation_end_time: input.endISO,
    reservation_purpose: input.purpose.trim(),
    guest_identifier_param: input.guestIdentifier || null,
    user_display_name_param: input.userDisplayName || null,
  });

  if (error) {
    return { ok: false as const, message: error.message };
  }

  // 알림 전송을 동기적으로 처리하여 결과를 반환
  let slackSent = false;
  let slackMethod: "bot" | "webhook" | undefined;
  let discordSent = false;
  try {
    const { data: reservation } = await supabase
      .from("cabin_reservations")
      .select("id")
      .eq("cabin_id", input.cabinId)
      .eq("start_time", input.startISO)
      .eq("end_time", input.endISO)
      .eq("purpose", input.purpose.trim())
      .single();

    if (reservation) {
      // 서비스 인스턴스 생성
      const notificationService = new ShipNotificationService(supabase);

      // 예약 컨텍스트 조회 (cabin, ship, notification config)
      const context = await notificationService.getReservationContext(
        input.cabinId
      );

      if (context && (context.config.slack || context.config.discord)) {
        console.log("Sending reservation notification:", {
          roomName: context.roomName,
          startISO: input.startISO,
          endISO: input.endISO,
          purpose: input.purpose,
          hasSlackBotToken: !!context.config.slack?.botToken,
          hasSlackChannelId: !!context.config.slack?.channelId,
          hasDiscordWebhook: !!context.config.discord?.webhookUrl,
        });

        // 메시지 핸들러로 알림 전송
        const messageHandler = new ReservationMessageHandler(context.config);
        const {
          slackTs,
          slackMethod: method,
          discordSent: discord,
        } = await messageHandler.sendNotification({
          roomName: context.roomName,
          startISO: input.startISO,
          endISO: input.endISO,
          purpose: input.purpose,
          locale: input.locale,
          shipPublicId: context.ship.publicId,
          timeZone: context.ship.timeZone,
          linkLabel: `${t("ships.viewStatus", input.locale)}`,
        });

        console.log(
          "Notification sent, slackTs:",
          slackTs,
          "slackMethod:",
          method,
          "discordSent:",
          discord
        );

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
            slackSent = true;
            slackMethod = method;
          }
        } else if (method) {
          // ts가 없어도 전송은 성공한 경우 (webhook)
          slackSent = true;
          slackMethod = method;
        }

        // Discord 전송 결과
        if (discord) {
          discordSent = true;
        }
      }
    }
  } catch (e) {
    console.error("Notification failed", e);
  }

  return { ok: true as const, slackSent, slackMethod, discordSent };
}

export async function updateReservationSlackMessage(
  reservationId: string,
  startISO: string,
  endISO: string,
  purpose: string,
  cabinId: string,
  locale: "ko" | "en"
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
      return { success: false, reason: "no_slack_ts" };
    }

    // 서비스 인스턴스 생성
    const notificationService = new ShipNotificationService(supabase);

    // 예약 컨텍스트 조회
    const context = await notificationService.getReservationContext(cabinId);
    if (
      !context ||
      !context.config.slack?.botToken ||
      !context.config.slack?.channelId
    ) {
      console.log("Slack bot config missing");
      return { success: false, reason: "no_slack_config" };
    }

    // 메시지 핸들러로 메시지 업데이트
    const messageHandler = new ReservationMessageHandler(context.config);
    await messageHandler.updateNotification({
      roomName: context.roomName,
      startISO,
      endISO,
      purpose,
      locale,
      shipPublicId: context.ship.publicId,
      timeZone: context.ship.timeZone,
      linkLabel: `${t("ships.viewStatus", locale)}`, // ${context.ship.name}
      messageTs: reservation.slack_message_ts,
    });

    console.log("Slack message updated successfully");
    return { success: true };
  } catch (error) {
    NotificationErrorHandler.handleSlackError(
      "update",
      error,
      "Reservation message update"
    );
    return { success: false, reason: "error", error };
  }
}

// line-through 삭제 동작은 더 이상 사용하지 않음
