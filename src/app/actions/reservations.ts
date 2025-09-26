"use server";

import { cookies } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  postToSlack,
  composeReservationSlackText,
} from "@/lib/notifications/slack";
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
        .select("name, public_id, slack_webhook_url")
        .eq("id", cabin.ship_id)
        .single();

      const webhook = ship?.slack_webhook_url || undefined;
      if (!webhook) return;

      const roomName = cabin.name || ship?.name || "Room";
      const text = composeReservationSlackText({
        roomName,
        startISO: input.startISO,
        endISO: input.endISO,
        purpose: input.purpose,
        locale: input.locale,
        shipPublicId: ship?.public_id,
        linkLabel: t("ships.viewStatus", input.locale),
      });

      await postToSlack(webhook, { text });
    } catch (e) {
      console.error("Slack notify failed", e);
    }
  })();

  return { ok: true as const };
}
