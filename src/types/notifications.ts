// 알림 관련 타입 정의들

export type NotificationChannel = "slack" | "discord";

export type SlackNotificationConfig = {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
};

export type DiscordNotificationConfig = {
  webhookUrl: string;
};

export type NotificationConfig = {
  slack?: SlackNotificationConfig;
  discord?: DiscordNotificationConfig;
};

// 데이터베이스에서 조회되는 알림 설정
export type DatabaseNotificationSettings = {
  channel: NotificationChannel;
  webhook_url?: string | null;
  slack_bot_token?: string | null;
  slack_channel_id?: string | null;
  enabled: boolean;
};

// 메시지 전송 파라미터
export type ReservationNotificationParams = {
  roomName: string;
  startISO: string;
  endISO: string;
  purpose: string;
  locale: "ko" | "en";
  shipPublicId?: string;
  linkLabel?: string;
};

// 메시지 업데이트 파라미터
export type UpdateReservationNotificationParams =
  ReservationNotificationParams & {
    messageTs?: string; // Slack 메시지 timestamp
  };

// 메시지 전송 결과
export type SendNotificationResult = {
  slackTs?: string;
};

// Ship 및 Cabin 정보
export type ShipInfo = {
  id: string;
  name: string;
  publicId?: string;
};

export type CabinInfo = {
  id: string;
  name?: string;
  shipId: string;
};

// 예약 컨텍스트 (메시지 전송에 필요한 모든 정보)
export type ReservationContext = {
  cabin: CabinInfo;
  ship: ShipInfo;
  config: NotificationConfig;
  roomName: string;
};
