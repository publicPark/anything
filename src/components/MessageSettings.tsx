"use client";

import { useMemo, useState, useEffect } from "react";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Toggle } from "@/components/ui/Toggle";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { composeReservationSlackText } from "@/lib/notifications/slack";
import { composeReservationDiscordText } from "@/lib/notifications/discord";

interface MessageSettingsProps {
  shipId: string;
  shipName: string;
  shipPublicId?: string;
  locale: string;
  slackWebhookUrl?: string | null;
  onSaved?: () => void;
}

interface NotificationSettings {
  slack: {
    webhookUrl: string;
    botToken: string;
    channelId: string;
    enabled: boolean;
  };
  discord: {
    webhookUrl: string;
    enabled: boolean;
  };
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
  const [settings, setSettings] = useState<NotificationSettings>({
    slack: { webhookUrl: "", botToken: "", channelId: "", enabled: false },
    discord: { webhookUrl: "", enabled: false },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // 알림 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();
        const { data: notifications } = await supabase
          .from("ship_notifications")
          .select(
            "channel, webhook_url, slack_bot_token, slack_channel_id, enabled"
          )
          .eq("ship_id", shipId);

        if (notifications) {
          const slackNotif = notifications.find((n) => n.channel === "slack");
          const discordNotif = notifications.find(
            (n) => n.channel === "discord"
          );

          setSettings({
            slack: {
              webhookUrl: slackNotif?.webhook_url || "",
              botToken: slackNotif?.slack_bot_token || "",
              channelId: slackNotif?.slack_channel_id || "",
              enabled: slackNotif?.enabled || false,
            },
            discord: {
              webhookUrl: discordNotif?.webhook_url || "",
              enabled: discordNotif?.enabled || false,
            },
          });
        }
      } catch (error) {
        console.error("설정 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [shipId]);

  const slackPreviewText = useMemo(() => {
    try {
      const now = new Date();
      now.setSeconds(0, 0);
      const start = new Date(now);
      start.setHours(14, 0, 0, 0);
      const end = new Date(now);
      end.setHours(14, 30, 0, 0);

      return composeReservationSlackText({
        roomName: `${shipName} ${t("ships.cabinName")}`,
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
  }, [shipName, locale, t, shipPublicId]);

  const discordPreviewText = useMemo(() => {
    try {
      const now = new Date();
      now.setSeconds(0, 0);
      const start = new Date(now);
      start.setHours(14, 0, 0, 0);
      const end = new Date(now);
      end.setHours(14, 30, 0, 0);

      return composeReservationDiscordText({
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
  }, [shipName, locale, t, shipPublicId]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const supabase = createClient();

      // 입력값 검증
      const webhook = settings.slack.webhookUrl.trim();
      const token = settings.slack.botToken.trim();
      const channel = settings.slack.channelId.trim();

      // 최소 조합: (token + channel) 또는 (webhook)
      const hasApiCombo = token.length > 0 && channel.length > 0;
      const hasWebhook = webhook.length > 0;

      // 부분 입력 케이스 처리 (예: 채널만 입력 등)
      const someProvided = webhook || token || channel;
      if (someProvided && !hasApiCombo && !hasWebhook) {
        // 불완전 입력 → 에러 토스트 후 저장 중단
        toast.error(t("validation.allFieldsRequired"));
        return;
      }

      // 간단한 형식 검증 (있을 때만)
      if (token && !token.startsWith("xoxb-")) {
        toast.error(t("validation.required"));
        return;
      }
      if (channel && !/^C[A-Z0-9]{8,}$/i.test(channel)) {
        toast.error(t("validation.required"));
        return;
      }
      if (
        webhook &&
        !/^https:\/\/hooks\.slack\.com\/services\//.test(webhook)
      ) {
        toast.error(t("validation.required"));
        return;
      }

      // Slack 설정 저장/업데이트
      if (hasWebhook || token) {
        const { error: slackError } = await supabase
          .from("ship_notifications")
          .upsert(
            {
              ship_id: shipId,
              channel: "slack",
              webhook_url: hasWebhook ? webhook : null,
              slack_bot_token: token || null,
              slack_channel_id: channel || null,
              enabled: settings.slack.enabled,
            },
            { onConflict: "ship_id,channel" }
          );

        if (slackError) {
          console.error("Slack 설정 저장 실패:", slackError);
          toast.error(t("validation.allFieldsRequired"));
          return;
        }
      } else {
        // 모든 Slack 설정이 비어있으면 삭제
        await supabase
          .from("ship_notifications")
          .delete()
          .eq("ship_id", shipId)
          .eq("channel", "slack");
      }

      // Discord 설정 저장/업데이트
      if (settings.discord.webhookUrl.trim()) {
        const { error: discordError } = await supabase
          .from("ship_notifications")
          .upsert(
            {
              ship_id: shipId,
              channel: "discord",
              webhook_url: settings.discord.webhookUrl.trim(),
              enabled: settings.discord.enabled,
            },
            { onConflict: "ship_id,channel" }
          );

        if (discordError) {
          console.error("Discord 설정 저장 실패:", discordError);
          toast.error(t("validation.allFieldsRequired"));
          return;
        }
      } else {
        // 웹훅 URL이 비어있으면 삭제
        await supabase
          .from("ship_notifications")
          .delete()
          .eq("ship_id", shipId)
          .eq("channel", "discord");
      }

      onSaved?.();
      toast.success(t("ships.save"));
    } catch (error) {
      console.error("Network Error:", error);
      toast.error(t("errors.auth.serverError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      {/* Slack 설정 */}
      <div className="space-y-4 bg-background rounded-lg border border-border p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">
            {t("ships.slackTitle")}
          </h4>
          <Toggle
            checked={settings.slack.enabled}
            onChange={(enabled) =>
              setSettings((prev) => ({
                ...prev,
                slack: { ...prev.slack, enabled },
              }))
            }
            aria-label={t("ships.slackTitle")}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("ships.slackBotTokenLabel")}
            </label>
            <input
              type="text"
              value={settings.slack.botToken}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  slack: { ...prev.slack, botToken: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              placeholder="xoxb-..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("ships.slackBotTokenHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("ships.slackChannelId")}
            </label>
            <input
              type="text"
              value={settings.slack.channelId}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  slack: { ...prev.slack, channelId: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
              placeholder="C1234567890"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("ships.slackChannelIdHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {t("ships.slackWebhookUrl")}
            </label>
            <input
              type="url"
              value={settings.slack.webhookUrl}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  slack: { ...prev.slack, webhookUrl: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("ships.slackWebhookHelp")}
            </p>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-foreground mb-2">
            {t("ships.slackExampleTitle")}
          </div>
          <div className="bg-muted p-3 rounded-md border">
            <pre className="text-sm whitespace-pre-wrap text-foreground">
              {slackPreviewText}
            </pre>
          </div>
        </div>
      </div>

      {/* Discord 설정 */}
      {/* <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-foreground">Discord 알림</h4>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.discord.enabled}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                discord: { ...prev.discord, enabled: e.target.checked }
              }))}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">활성화</span>
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Discord 웹훅 URL
          </label>
          <input
            type="url"
            value={settings.discord.webhookUrl}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              discord: { ...prev.discord, webhookUrl: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://discord.com/api/webhooks/..."
          />
        </div>
        
        <div>
          <div className="text-sm font-medium text-foreground mb-2">
            Discord 메시지 미리보기
          </div>
          <div className="bg-muted p-3 rounded-md border">
            <pre className="text-sm whitespace-pre-wrap text-foreground">
              {discordPreviewText}
            </pre>
          </div>
        </div>
      </div> */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          disabled={saving}
        >
          {saving ? t("common.processing") : t("ships.save")}
        </button>
      </div>
    </div>
  );
}
