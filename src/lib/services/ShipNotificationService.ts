import { SupabaseClient } from "@supabase/supabase-js";
import {
  NotificationConfig,
  ShipInfo,
  CabinInfo,
  DatabaseNotificationSettings,
  ReservationContext,
} from "@/types/notifications";

export type NotificationSettings = DatabaseNotificationSettings;

// 알림 설정 조회 및 구성 서비스
export class ShipNotificationService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Ship 정보를 조회합니다.
   */
  async getShipInfo(shipId: string): Promise<ShipInfo | null> {
    const { data, error } = await this.supabase
      .from("ships")
      .select("id, name, public_id")
      .eq("id", shipId)
      .single();

    if (error || !data) {
      console.error("Failed to fetch ship info:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      publicId: data.public_id,
    };
  }

  /**
   * Cabin 정보를 조회합니다.
   */
  async getCabinInfo(cabinId: string): Promise<CabinInfo | null> {
    const { data, error } = await this.supabase
      .from("ship_cabins")
      .select("id, name, ship_id")
      .eq("id", cabinId)
      .single();

    if (error || !data) {
      console.error("Failed to fetch cabin info:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      shipId: data.ship_id,
    };
  }

  /**
   * Ship의 활성화된 알림 설정들을 조회합니다.
   */
  async getEnabledNotificationSettings(
    shipId: string
  ): Promise<NotificationSettings[]> {
    const { data, error } = await this.supabase
      .from("ship_notifications")
      .select(
        "channel, webhook_url, slack_bot_token, slack_channel_id, enabled"
      )
      .eq("ship_id", shipId)
      .eq("enabled", true);

    if (error) {
      console.error("Failed to fetch notification settings:", error);
      return [];
    }

    return (data || []).map((setting) => ({
      channel: setting.channel,
      webhookUrl: setting.webhook_url,
      slackBotToken: setting.slack_bot_token,
      slackChannelId: setting.slack_channel_id,
      enabled: setting.enabled,
    }));
  }

  /**
   * Cabin ID로 Ship 정보를 조회합니다.
   */
  async getShipInfoByCabinId(cabinId: string): Promise<ShipInfo | null> {
    const cabinInfo = await this.getCabinInfo(cabinId);
    if (!cabinInfo) return null;

    return this.getShipInfo(cabinInfo.shipId);
  }

  /**
   * 알림 설정들을 NotificationConfig 형식으로 변환합니다.
   */
  buildNotificationConfig(
    settings: NotificationSettings[]
  ): NotificationConfig {
    const config: NotificationConfig = {};

    const slackSetting = settings.find((s) => s.channel === "slack");
    if (slackSetting) {
      config.slack = {
        webhookUrl: slackSetting.webhookUrl || undefined,
        botToken: slackSetting.slackBotToken || undefined,
        channelId: slackSetting.slackChannelId || undefined,
      };
    }

    const discordSetting = settings.find((s) => s.channel === "discord");
    if (discordSetting?.webhookUrl) {
      config.discord = {
        webhookUrl: discordSetting.webhookUrl,
      };
    }

    return config;
  }

  /**
   * Ship ID로 완전한 알림 설정을 구성합니다.
   */
  async getNotificationConfigForShip(
    shipId: string
  ): Promise<NotificationConfig> {
    const settings = await this.getEnabledNotificationSettings(shipId);
    return this.buildNotificationConfig(settings);
  }

  /**
   * Cabin ID로 완전한 알림 설정을 구성합니다.
   */
  async getNotificationConfigForCabin(
    cabinId: string
  ): Promise<NotificationConfig> {
    const cabinInfo = await this.getCabinInfo(cabinId);
    if (!cabinInfo) return {};

    return this.getNotificationConfigForShip(cabinInfo.shipId);
  }

  /**
   * 예약 메시지 전송에 필요한 모든 정보를 한 번에 조회합니다.
   */
  async getReservationContext(
    cabinId: string
  ): Promise<ReservationContext | null> {
    const [cabin, ship] = await Promise.all([
      this.getCabinInfo(cabinId),
      this.getShipInfoByCabinId(cabinId),
    ]);

    if (!cabin || !ship) return null;

    const config = await this.getNotificationConfigForShip(ship.id);
    const roomName = cabin.name || ship.name || "Room";

    return {
      cabin,
      ship,
      config,
      roomName,
    };
  }
}
