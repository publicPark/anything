import { NotificationChannel } from "@/types/notifications";

// 알림 관련 에러 타입들
export class NotificationError extends Error {
  constructor(
    message: string,
    public readonly channel: NotificationChannel,
    public readonly operation: "send" | "update" | "delete",
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "NotificationError";
  }
}

export class SlackApiError extends NotificationError {
  constructor(
    operation: "send" | "update" | "delete",
    message: string,
    originalError?: Error
  ) {
    super(
      `Slack API ${operation} failed: ${message}`,
      "slack",
      operation,
      originalError
    );
    this.name = "SlackApiError";
  }
}

export class DiscordApiError extends NotificationError {
  constructor(
    operation: "send" | "update" | "delete",
    message: string,
    originalError?: Error
  ) {
    super(
      `Discord API ${operation} failed: ${message}`,
      "discord",
      operation,
      originalError
    );
    this.name = "DiscordApiError";
  }
}

// 공통 에러 처리 유틸리티
export class NotificationErrorHandler {
  private static logError(error: NotificationError): void {
    const logData = {
      channel: error.channel,
      operation: error.operation,
      message: error.message,
      originalError: error.originalError?.message,
      timestamp: new Date().toISOString(),
    };

    console.error(
      `[${error.channel.toUpperCase()}] ${error.operation} failed:`,
      logData
    );

    // 추후에 모니터링 시스템이나 로깅 서비스로 전송할 수 있음
    // await monitoringService.logError(logData);
  }

  /**
   * 알림 작업의 성공/실패를 로깅하고 에러를 처리합니다.
   * Promise.allSettled의 결과를 처리하는 데 유용합니다.
   */
  static handleSettledResult(
    result: PromiseSettledResult<any>,
    context: string
  ): void {
    if (result.status === "rejected") {
      console.error(`${context} failed:`, result.reason);
    } else {
      console.log(`${context} succeeded`);
    }
  }

  /**
   * Slack API 에러를 표준화된 형식으로 처리합니다.
   */
  static handleSlackError(
    operation: "send" | "update" | "delete",
    error: unknown,
    context?: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    const slackError = new SlackApiError(
      operation,
      fullMessage,
      error instanceof Error ? error : undefined
    );
    this.logError(slackError);
  }

  /**
   * Discord API 에러를 표준화된 형식으로 처리합니다.
   */
  static handleDiscordError(
    operation: "send" | "update" | "delete",
    error: unknown,
    context?: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    const discordError = new DiscordApiError(
      operation,
      fullMessage,
      error instanceof Error ? error : undefined
    );
    this.logError(discordError);
  }

  /**
   * 일반적인 알림 에러를 처리합니다.
   */
  static handleNotificationError(error: NotificationError): void {
    this.logError(error);
  }

  /**
   * 여러 알림 작업의 결과를 일괄 처리합니다.
   * Promise.allSettled의 결과를 받아서 적절히 로깅합니다.
   */
  static handleBatchResults(
    results: PromiseSettledResult<any>[],
    contexts: string[]
  ): { successCount: number; failureCount: number } {
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      const context = contexts[index] || `Operation ${index + 1}`;
      if (result.status === "fulfilled") {
        successCount++;
        console.log(`${context} succeeded`);
      } else {
        failureCount++;
        console.error(`${context} failed:`, result.reason);
      }
    });

    return { successCount, failureCount };
  }

  /**
   * 데이터베이스 조회 실패를 처리합니다.
   */
  static handleDatabaseError(operation: string, error: unknown): null {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Database ${operation} failed:`, errorMessage);
    return null;
  }
}
