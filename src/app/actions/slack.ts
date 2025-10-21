"use server";

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { ShipNotificationService } from "@/lib/services/ShipNotificationService";
import { NotificationErrorHandler } from "@/lib/utils/notification-error-handler";

// 예약 삭제 시 Slack 메시지를 실제 삭제 (채널/ts 기반)
export async function deleteReservationSlackMessageAction(
  cabinId: string,
  messageTs: string
) {
  const supabase = await createServerSupabase();
  try {
    const notificationService = new ShipNotificationService(supabase);
    const config = await notificationService.getNotificationConfigForCabin(
      cabinId
    );
    if (!config.slack?.botToken || !config.slack?.channelId) {
      return { success: false as const, reason: "no_slack_config" };
    }

    const { deleteSlackMessage } = await import("@/lib/notifications/slack");
    await deleteSlackMessage(
      config.slack.botToken,
      config.slack.channelId,
      messageTs
    );
    return { success: true as const };
  } catch (error) {
    NotificationErrorHandler.handleSlackError(
      "delete",
      error,
      "Reservation message delete"
    );
    return { success: false as const, reason: "error", error };
  }
}
