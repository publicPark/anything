"use client";

import { useState, useEffect } from "react";
import { CabinReservation } from "@/types/database";
import { useReservationStore } from "@/stores/reservationStore";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useI18n } from "@/hooks/useI18n";

/**
 * TimeTable 컴포넌트
 *
 * 5분 단위로 시간 슬롯을 표시하고 사용자가 시간 범위를 선택할 수 있게 해주는 컴포넌트입니다.
 *
 * 주요 기능:
 * - 현재 시간부터 24시간 동안의 시간 슬롯 표시
 * - 예약된 시간과 과거 시간 구분 표시
 * - 시간 범위 선택 및 검증
 * - 사용자 친화적인 알림 메시지
 *
 * @param selectedDate - 선택된 날짜 (YYYY-MM-DD 형식)
 * @param reservations - 해당 날짜의 예약 목록
 * @param className - 추가 CSS 클래스
 */

interface TimeTableProps {
  selectedDate: string;
  reservations: CabinReservation[];
  className?: string;
}

interface TimeSlot {
  time: string;
  isReserved: boolean;
  isSelected: boolean;
  isStart: boolean;
  isEnd: boolean;
  isDisabled?: boolean;
  isCurrentTime?: boolean;
  isReservationStart?: boolean;
}

interface NotificationState {
  message: string;
  variant: "default" | "destructive" | "success";
}

interface ReservationStatus {
  isReserved: boolean;
  isReservationStart: boolean;
}

interface TimeStatus {
  isDisabled: boolean;
  isCurrentTime: boolean;
}

export function TimeTable({
  selectedDate,
  reservations,
  className = "",
}: TimeTableProps) {
  const { t } = useI18n();
  const { selectedStartTime, selectedEndTime, setSelectedTimes } =
    useReservationStore();
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  /**
   * 5분 단위로 시간 슬롯을 생성합니다.
   * 0:00부터 47:55까지 48시간 동안의 모든 5분 단위 시간을 생성합니다.
   *
   * @returns 생성된 시간 슬롯 배열
   */
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    for (let hour = 0; hour < 48; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        slots.push({
          time: timeString,
          isReserved: false,
          isSelected: false,
          isStart: false,
          isEnd: false,
        });
      }
    }
    return slots;
  };

  /**
   * 슬롯 시간 문자열을 실제 Date 객체로 변환합니다.
   * 24시간을 넘어가는 경우 다음 날로 처리합니다.
   *
   * @param slotTime - 변환할 시간 문자열 (HH:MM 형식)
   * @returns 변환된 Date 객체
   */
  const getSlotDateTime = (slotTime: string): Date => {
    const slotHour = parseInt(slotTime.split(":")[0]);
    const slotMinute = parseInt(slotTime.split(":")[1]);

    let slotDate = new Date(selectedDate);
    let actualHour = slotHour;

    // 24시간을 넘어가면 다음 날로 처리
    if (slotHour >= 24) {
      slotDate.setDate(slotDate.getDate() + 1);
      actualHour = slotHour - 24;
    }

    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(actualHour, slotMinute, 0, 0);
    return slotDateTime;
  };

  /**
   * 특정 시간 슬롯의 예약 상태를 확인합니다.
   *
   * @param slotDateTime - 확인할 시간의 Date 객체
   * @returns 예약 상태 정보 (예약됨, 예약 시작점 여부)
   */
  const checkReservationStatus = (slotDateTime: Date): ReservationStatus => {
    // 예약 시작점인지 먼저 확인
    const isReservationStart = reservations.some((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const start = new Date(reservation.start_time);
      return slotDateTime.getTime() === start.getTime();
    });

    // 예약된 시간인지 확인 (시작점 포함)
    const isReserved = reservations.some((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      // 시작점부터 종료점 이전까지 예약된 것으로 간주
      return slotDateTime >= start && slotDateTime < end;
    });

    return { isReserved, isReservationStart };
  };

  /**
   * 시간 문자열을 분 단위로 변환합니다.
   * @param timeString - HH:MM 형식의 시간 문자열
   * @returns 분 단위 숫자
   */
  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  /**
   * 시간 슬롯의 상태를 확인합니다 (비활성화, 현재 시간 등).
   *
   * @param slotTime - 확인할 시간 문자열
   * @param isToday - 오늘 날짜인지 여부
   * @returns 시간 상태 정보 (비활성화, 현재 시간 여부)
   */
  const checkTimeStatus = (slotTime: string, isToday: boolean): TimeStatus => {
    const now = new Date();
    const currentTime = isToday
      ? `${now.getHours().toString().padStart(2, "0")}:${
          Math.floor(now.getMinutes() / 5) * 5
        }`
      : null;

    const currentTimeSlot = isToday
      ? `${now.getHours().toString().padStart(2, "0")}:${
          Math.floor(now.getMinutes() / 5) * 5
        }`
      : null;

    // 시간을 분 단위로 변환하여 정확한 비교
    const isDisabled = Boolean(
      isToday &&
        currentTime &&
        timeStringToMinutes(slotTime) < timeStringToMinutes(currentTime)
    );
    const isCurrentTime = Boolean(
      isToday && currentTimeSlot && slotTime === currentTimeSlot
    );

    return { isDisabled, isCurrentTime };
  };

  /**
   * 모든 시간 슬롯의 상태를 체크하고 업데이트합니다.
   *
   * @param slots - 상태를 체크할 시간 슬롯 배열
   * @returns 상태가 업데이트된 시간 슬롯 배열
   */
  const checkSlotStatus = (slots: TimeSlot[]): TimeSlot[] => {
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();

    return slots.map((slot) => {
      const slotDateTime = getSlotDateTime(slot.time);
      const { isReserved, isReservationStart } =
        checkReservationStatus(slotDateTime);
      const { isDisabled, isCurrentTime } = checkTimeStatus(slot.time, isToday);

      return {
        ...slot,
        isReserved,
        isDisabled,
        isCurrentTime,
        isReservationStart,
      };
    });
  };

  // 시간 슬롯 업데이트
  useEffect(() => {
    const slots = generateTimeSlots();
    const slotsWithStatus = checkSlotStatus(slots);
    setTimeSlots(slotsWithStatus);

    // 오늘 날짜면 현재 시간으로 스크롤
    const now = new Date();
    const isToday =
      new Date(selectedDate).toDateString() === now.toDateString();
    if (isToday) {
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${
        Math.floor(now.getMinutes() / 5) * 5
      }`;
      setTimeout(() => {
        document.querySelector(`[data-time="${currentTime}"]`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [selectedDate, reservations]);

  /**
   * 사용자에게 알림 메시지를 표시합니다.
   * 3초 후 자동으로 사라집니다.
   *
   * @param message - 표시할 메시지
   * @param variant - 알림 타입 (기본값: destructive)
   */
  const showNotification = (
    message: string,
    variant: "default" | "destructive" | "success" = "destructive"
  ): void => {
    setNotification({ message, variant });
    setTimeout(() => setNotification(null), 3000);
  };

  /**
   * 선택된 시간 범위에 예약이 포함되어 있는지 확인합니다.
   *
   * @param startTime - 시작 시간
   * @param endTime - 종료 시간
   * @returns 예약이 포함되어 있으면 true
   */
  const hasReservationInRange = (
    startTime: string,
    endTime: string
  ): boolean => {
    return timeSlots.some((slot) => {
      if (!slot.isReserved || slot.isReservationStart) return false;
      return slot.time > startTime && slot.time < endTime;
    });
  };

  /**
   * 시간 슬롯 클릭을 처리합니다.
   * 예약된 시간이나 과거 시간 클릭 시 알림을 표시하고,
   * 유효한 시간 클릭 시 선택 상태를 업데이트합니다.
   *
   * @param time - 클릭된 시간 문자열
   */
  const handleTimeClick = (time: string): void => {
    const slot = timeSlots.find((s) => s.time === time);
    if (!slot) return;

    // 예약된 시간인 경우 (시작점 포함)
    if (slot.isReserved) {
      showNotification(t("timetable.reservedTimeNotification", { time }));
      return;
    }

    // 비활성화된 시간인 경우
    if (slot.isDisabled) {
      showNotification(t("timetable.pastTimeNotification", { time }));
      return;
    }

    if (!selectedStartTime) {
      setSelectedTimes(time, null);
    } else if (selectedStartTime === time) {
      setSelectedTimes(null, null);
    } else if (!selectedEndTime) {
      const startTime = time < selectedStartTime ? time : selectedStartTime;
      const endTime = time < selectedStartTime ? selectedStartTime : time;

      if (hasReservationInRange(startTime, endTime)) {
        showNotification(t("timetable.reservationInRangeNotification"));
        return;
      }

      setSelectedTimes(startTime, endTime);
    } else {
      setSelectedTimes(time, null);
    }
  };

  // 시간 슬롯 스타일 계산
  const getSlotStyle = (slot: TimeSlot, index: number, totalSlots: number) => {
    let baseStyle =
      "h-8 text-xs border-y border-border cursor-pointer transition-colors flex-1 px-2 ";

    // 첫 번째와 마지막 버튼에만 rounded 적용
    if (index === 0) {
      baseStyle += "border-l border-l-border rounded-l-md ";
    } else {
      // 중간 버튼들에는 왼쪽 구분선 추가
      baseStyle += "border-l border-l-border ";
    }
    if (index === totalSlots - 1) {
      baseStyle += "border-r border-r-border rounded-r-md ";
    }

    if (slot.isReserved) {
      baseStyle +=
        "bg-destructive text-destructive-foreground/70 cursor-not-allowed border-destructive/50 ";
    } else if (slot.isDisabled) {
      baseStyle +=
        "bg-muted-foreground/50 text-muted-foreground cursor-not-allowed border-muted-foreground/30 ";
    } else if (selectedStartTime && selectedEndTime) {
      // 완전히 선택된 상태
      const slotTime = slot.time;
      if (slotTime >= selectedStartTime && slotTime < selectedEndTime) {
        baseStyle += "bg-primary text-primary-foreground ";
      } else if (
        slotTime === selectedStartTime ||
        slotTime === selectedEndTime
      ) {
        baseStyle += "bg-primary text-primary-foreground ";
      } else {
        baseStyle += "bg-muted hover:bg-muted/80 ";
      }
    } else if (selectedStartTime && !selectedEndTime) {
      // 시작 시간만 선택된 상태
      if (slot.time === selectedStartTime) {
        baseStyle += "bg-primary text-primary-foreground ";
      } else if (hoveredTime && selectedStartTime) {
        // hover 시 영역 표시
        const startTime = selectedStartTime;
        const endTime = hoveredTime;
        const slotTime = slot.time;

        if (startTime < endTime) {
          if (slotTime >= startTime && slotTime < endTime) {
            baseStyle += "bg-primary text-primary-foreground ";
          } else {
            baseStyle += "bg-muted hover:bg-muted/80 ";
          }
        } else {
          if (slotTime >= endTime && slotTime < startTime) {
            baseStyle += "bg-primary text-primary-foreground ";
          } else {
            baseStyle += "bg-muted hover:bg-muted/80 ";
          }
        }
      } else {
        baseStyle += "bg-muted hover:bg-muted/80 ";
      }
    } else {
      baseStyle += "bg-muted hover:bg-muted/80 ";
    }

    return baseStyle;
  };

  // 마우스 이벤트 핸들러
  const handleMouseEnter = (time: string) => {
    if (selectedStartTime && !selectedEndTime) {
      setHoveredTime(time);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
  };

  // 선택된 시간을 포맷팅하는 함수
  const formatSelectedTime = (startTime: string, endTime: string) => {
    const selectedDateObj = new Date(selectedDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const selectedDateOnly = new Date(
      selectedDateObj.getFullYear(),
      selectedDateObj.getMonth(),
      selectedDateObj.getDate()
    );

    let dateLabel = "";
    if (selectedDateOnly.getTime() === today.getTime()) {
      dateLabel = t("timetable.today");
    } else if (selectedDateOnly.getTime() === tomorrow.getTime()) {
      dateLabel = t("timetable.tomorrow");
    } else {
      const month = selectedDateObj.getMonth() + 1;
      const day = selectedDateObj.getDate();
      dateLabel = `${month}월 ${day}일`;
    }

    return t("timetable.timeRange", {
      startTime: `${dateLabel} ${startTime}`,
      endTime,
    });
  };

  // 시간을 1시간 단위로 그룹화하되, 현재 시간대부터 24시간만 표시
  const groupedSlots = timeSlots.reduce((groups, slot) => {
    const hour = slot.time.split(":")[0];
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();

    // 오늘 날짜일 때만 현재 시간 이전의 시간대는 제외하고, 24시간 후까지만 표시
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const slotHour = parseInt(hour);
      const slotMinute = parseInt(slot.time.split(":")[1]);

      // 현재 시간대보다 이전인 경우 제외 (예: 7:47이면 6:00 시간대는 제외)
      if (slotHour < currentHour) {
        return groups;
      }

      // 현재 시간 + 24시간보다 이후인 경우 제외
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const maxTimeInMinutes = currentTimeInMinutes + 24 * 60; // 24시간 후
      const slotTimeInMinutes = slotHour * 60;

      if (slotTimeInMinutes > maxTimeInMinutes) {
        return groups;
      }
    }

    if (!groups[hour]) {
      groups[hour] = [];
    }
    groups[hour].push(slot);
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 알림 메시지 */}
      {notification && (
        <ErrorMessage
          message={notification.message}
          variant={notification.variant}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="text-sm text-muted-foreground">
        {selectedStartTime && !selectedEndTime && (
          <p>{t("timetable.selectedTime", { time: selectedStartTime })}</p>
        )}
        {selectedStartTime && selectedEndTime && (
          <p>{formatSelectedTime(selectedStartTime, selectedEndTime)}</p>
        )}
        {!selectedStartTime && <p>{t("timetable.selectTime")}</p>}
      </div>

      <div className="max-h-80 overflow-auto border border-border p-4">
        {/* 색상 설명 */}
        <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-destructive rounded border border-border"></div>
            <span>{t("ships.reservedTime")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-primary rounded border border-border"></div>
            <span>{t("ships.selectedTime")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted rounded border border-border"></div>
            <span>{t("ships.availableTime")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted-foreground/50 rounded border border-border"></div>
            <span>{t("ships.pastTime")}</span>
          </div>
        </div>

        <div className="space-y-1">
          {/* 시간대별 행들 */}
          {Object.entries(groupedSlots).map(([hour, slots], hourIndex) => {
            const isTomorrowStart = parseInt(hour) === 24;
            const isFirstHour = hourIndex === 0;

            return (
              <div key={hour}>
                {/* 다음날 표시 */}
                {isTomorrowStart && (
                  <div className="text-sm font-medium text-foreground mb-2 mt-4">
                    {t("common.nextDay")}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {/* 5분 단위 버튼들 */}
                  <div className="flex flex-1">
                    {slots.map((slot, index) => {
                      const isFirst = index === 0;
                      const isLast = index === slots.length - 1;

                      return (
                        <button
                          key={slot.time}
                          data-time={slot.time}
                          onClick={() => handleTimeClick(slot.time)}
                          onMouseEnter={() => handleMouseEnter(slot.time)}
                          onMouseLeave={handleMouseLeave}
                          disabled={false}
                          className={`h-8 text-xs border-y border-border cursor-pointer transition-colors flex items-center justify-center px-1 flex-1 ${
                            isFirst
                              ? "border-l border-l-border rounded-l-md"
                              : "border-l border-l-border"
                          } ${
                            isLast
                              ? "border-r border-r-border rounded-r-md"
                              : ""
                          } ${
                            slot.isReserved
                              ? "bg-destructive text-destructive-foreground/70"
                              : slot.isDisabled
                              ? "bg-muted-foreground/50 text-muted-foreground"
                              : selectedStartTime && selectedEndTime
                              ? slot.time >= selectedStartTime &&
                                slot.time < selectedEndTime
                                ? "bg-primary text-primary-foreground"
                                : slot.time === selectedStartTime ||
                                  slot.time === selectedEndTime
                                ? "bg-primary text-primary-foreground"
                                : slot.isCurrentTime
                                ? "bg-amber-500/30 text-amber-900"
                                : "bg-muted hover:bg-muted/80"
                              : selectedStartTime && !selectedEndTime
                              ? slot.time === selectedStartTime
                                ? "bg-primary text-primary-foreground"
                                : hoveredTime && selectedStartTime
                                ? (() => {
                                    const startTime = selectedStartTime;
                                    const endTime = hoveredTime;
                                    const slotTime = slot.time;
                                    if (startTime < endTime) {
                                      return slotTime >= startTime &&
                                        slotTime < endTime
                                        ? "bg-primary text-primary-foreground"
                                        : slotTime === endTime
                                        ? "bg-primary text-primary-foreground"
                                        : slot.isCurrentTime
                                        ? "bg-amber-500/30 text-amber-900"
                                        : "bg-muted hover:bg-muted/80";
                                    } else {
                                      return slotTime >= endTime &&
                                        slotTime < startTime
                                        ? "bg-primary text-primary-foreground"
                                        : slotTime === endTime
                                        ? "bg-primary text-primary-foreground"
                                        : slot.isCurrentTime
                                        ? "bg-amber-500/30 text-amber-900"
                                        : "bg-muted hover:bg-muted/80";
                                    }
                                  })()
                                : slot.isCurrentTime
                                ? "bg-amber-500/30 text-amber-900"
                                : "bg-muted hover:bg-muted/80"
                              : slot.isCurrentTime
                              ? "bg-amber-500/30 text-amber-900 border-amber-500/50"
                              : hoveredTime && slot.time === hoveredTime
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          title={
                            slot.isReserved && !slot.isReservationStart
                              ? t("timetable.reservedTime", { time: slot.time })
                              : slot.isReservationStart
                              ? t("timetable.reservationStart", {
                                  time: slot.time,
                                })
                              : slot.isCurrentTime
                              ? t("timetable.currentTime", { time: slot.time })
                              : slot.isDisabled
                              ? t("timetable.pastTime", { time: slot.time })
                              : slot.time
                          }
                        >
                          {parseInt(slot.time.split(":")[0]) >= 24
                            ? `${(parseInt(slot.time.split(":")[0]) - 24)
                                .toString()
                                .padStart(2, "0")}:${slot.time.split(":")[1]}`
                            : slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
