"use server";

import { cookies } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { sendReservationNotification } from "@/lib/notifications";
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

  (async () => {
    try {
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

      // ship_notifications 테이블에서 활성화된 알림 설정 조회
      const { data: notifications } = await supabase
        .from("ship_notifications")
        .select("channel, webhook_url")
        .eq("ship_id", cabin.ship_id)
        .eq("enabled", true);

      if (!notifications || notifications.length === 0) return;

      const roomName = cabin.name || ship.name || "Room";
      
      // 통합 알림 시스템 사용
      const notificationConfig = {
        slack: notifications.find(n => n.channel === 'slack')?.webhook_url 
          ? { webhookUrl: notifications.find(n => n.channel === 'slack')!.webhook_url }
          : undefined,
        discord: notifications.find(n => n.channel === 'discord')?.webhook_url 
          ? { webhookUrl: notifications.find(n => n.channel === 'discord')!.webhook_url }
          : undefined,
      };

      // Slack 또는 Discord 웹훅이 하나라도 있으면 알림 전송
      if (notificationConfig.slack || notificationConfig.discord) {
        await sendReservationNotification(notificationConfig, {
          roomName,
          startISO: input.startISO,
          endISO: input.endISO,
          purpose: input.purpose,
          locale: input.locale,
          shipPublicId: ship.public_id,
          linkLabel: t("ships.viewStatus", input.locale),
        });
      }
    } catch (e) {
      console.error("Notification failed", e);
    }
  })();

  return { ok: true as const };
}
