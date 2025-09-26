"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { composeReservationSlackText } from "@/lib/notifications/slack";

interface MessageSettingsProps {
  shipId: string;
  shipName: string;
  shipPublicId?: string;
  locale: string;
  slackWebhookUrl?: string | null;
  onSaved?: () => void;
}

export function MessageSettings({
  shipId,
  shipName,
  shipPublicId,
  locale,
  slackWebhookUrl,
  onSaved,
}: MessageSettingsProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string>(slackWebhookUrl || "");
  const [saving, setSaving] = useState(false);

  const previewText = useMemo(() => {
    try {
      const now = new Date();
      now.setSeconds(0, 0);
      const start = new Date(now);
      start.setHours(14, 0, 0, 0);
      const end = new Date(now);
      end.setHours(14, 30, 0, 0);

      return composeReservationSlackText({
        roomName: shipName,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        purpose: t("ships.reservationPurposePlaceholder"),
        locale: locale === "ko" ? "ko" : "en",
        shipPublicId,
        linkLabel: t("ships.viewStatus"),
      });
    } catch {
      return "";
    }
  }, [shipName, locale, t]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const value = url.trim();
      const { error } = await supabase
        .from("ships")
        .update({ slack_webhook_url: value.length > 0 ? value : null })
        .eq("id", shipId);

      if (error) {
        console.error("Supabase Error:", error);
        alert(`저장 실패: ${error.message}`);
        return;
      }

      onSaved?.();
    } catch (error) {
      console.error("Network Error:", error);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("ships.slackWebhookUrl")}
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://hooks.slack.com/services/..."
        />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground mb-2">
          {t("ships.slackExampleTitle")}
        </div>
        <div className="bg-muted p-3 rounded-md border">
          <pre className="text-sm whitespace-pre-wrap text-foreground">
            {previewText}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          disabled={saving}
        >
          {t("ships.save")}
        </button>
      </div>
    </div>
  );
}
