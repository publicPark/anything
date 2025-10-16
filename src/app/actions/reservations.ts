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

      // 서비스 인스턴스 생성
      const notificationService = new ShipNotificationService(supabase);

      // 예약 컨텍스트 조회 (cabin, ship, notification config)
      const context = await notificationService.getReservationContext(
        input.cabinId
      );
      if (!context) return;

      // 알림 설정이 없으면 중단
      if (!context.config.slack && !context.config.discord) return;

      console.log("Sending reservation notification:", {
        roomName: context.roomName,
        startISO: input.startISO,
        endISO: input.endISO,
        purpose: input.purpose,
        hasSlackBotToken: !!context.config.slack?.botToken,
        hasSlackChannelId: !!context.config.slack?.channelId,
      });

      // 메시지 핸들러로 알림 전송
      const messageHandler = new ReservationMessageHandler(context.config);
      const { slackTs } = await messageHandler.sendNotification({
        roomName: context.roomName,
        startISO: input.startISO,
        endISO: input.endISO,
        purpose: input.purpose,
        locale: input.locale,
        shipPublicId: context.ship.publicId,
        timeZone: context.ship.timeZone,
        // linkLabel: `${context.ship.name} ${t(
        //   "ships.viewStatus",
        //   input.locale
        // )}`,
        linkLabel: `${t("ships.viewStatus", input.locale)}`,
      });

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
      return;
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
      return;
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
      linkLabel: `${context.ship.name} ${t("ships.viewStatus", locale)}`,
      messageTs: reservation.slack_message_ts,
    });

    console.log("Slack message updated successfully");
  } catch (error) {
    NotificationErrorHandler.handleSlackError(
      "update",
      error,
      "Reservation message update"
    );
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

  if (!messageTs) {
    console.log("❌ No slack message ts provided, skipping delete");
    return;
  }

  const supabase = await createServerSupabase();

  try {
    console.log("✅ Message ts found, proceeding with delete");

    // 서비스 인스턴스 생성
    const notificationService = new ShipNotificationService(supabase);

    // 알림 설정 조회
    const config = await notificationService.getNotificationConfigForCabin(
      cabinId
    );
    if (!config.slack?.botToken || !config.slack?.channelId) {
      console.log("Slack bot config missing");
      return;
    }

    // 메시지 핸들러로 메시지 삭제
    const messageHandler = new ReservationMessageHandler(config);
    await messageHandler.deleteNotification(messageTs);

    console.log("Slack message deleted successfully");
  } catch (error) {
    NotificationErrorHandler.handleSlackError(
      "delete",
      error,
      "Reservation message delete"
    );
  }
}
