"use client";

import { useState, useEffect, useCallback } from "react";
import { CabinReservation } from "@/types/database";
import { useReservationStore } from "@/stores/reservationStore";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Tooltip } from "@/components/ui/Tooltip";
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
  const [tooltip, setTooltip] = useState<{
    message: string;
    x: number;
    y: number;
    isBelow: boolean;
  } | null>(null);
  const [manualStartTime, setManualStartTime] = useState<string>("");
  const [manualEndTime, setManualEndTime] = useState<string>("");

  // 선택된 시간과 수동 입력 필드 동기화
  useEffect(() => {
    if (selectedStartTime && selectedEndTime) {
      setManualStartTime(selectedStartTime);
      setManualEndTime(selectedEndTime);
    } else {
      setManualStartTime("");
      setManualEndTime("");
    }
  }, [selectedStartTime, selectedEndTime]);

  /**
   * 수동으로 입력된 시간을 검증하고 설정합니다.
   */
  const handleManualTimeInput = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return;

    // 시간 형식 검증 (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return;
    }

    // 시작 시간이 종료 시간보다 늦은지 확인
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);

    if (start >= end) {
      return;
    }

    // 예약 범위 내에 예약이 있는지 확인
    if (hasReservationInRange(startTime, endTime)) {
      return;
    }

    // 시간 설정
    setSelectedTimes(startTime, endTime);
    setManualStartTime("");
    setManualEndTime("");
  };

  /**
   * 5분 단위로 시간 슬롯을 생성합니다.
   * 0:00부터 23:55까지 24시간 동안의 모든 5분 단위 시간을 생성하고, 마지막에 24:00을 추가합니다.
   *
   * @returns 생성된 시간 슬롯 배열
   */
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    for (let hour = 0; hour < 24; hour++) {
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

    // 24:00 슬롯 추가
    slots.push({
      time: "24:00",
      isReserved: false,
      isSelected: false,
      isStart: false,
      isEnd: false,
    });

    return slots;
  };

  /**
   * 슬롯 시간 문자열을 실제 Date 객체로 변환합니다.
   *
   * @param slotTime - 변환할 시간 문자열 (HH:MM 형식)
   * @returns 변환된 Date 객체
   */
  const getSlotDateTime = (slotTime: string): Date => {
    // 24:00은 다음날 00:00으로 처리
    if (slotTime === "24:00") {
      const slotDate = new Date(selectedDate);
      slotDate.setDate(slotDate.getDate() + 1);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate;
    }

    const slotHour = parseInt(slotTime.split(":")[0]);
    const slotMinute = parseInt(slotTime.split(":")[1]);

    const slotDate = new Date(selectedDate);
    slotDate.setHours(slotHour, slotMinute, 0, 0);
    return slotDate;
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
    // 24:00은 1440분 (24시간)으로 처리
    if (timeString === "24:00") {
      return 24 * 60;
    }
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
    if (!isToday) {
      return { isDisabled: false, isCurrentTime: false };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 현재 시간을 5분 단위로 반올림 (9:03 -> 9:00, 9:07 -> 9:05)
    const roundedMinute = Math.floor(currentMinute / 5) * 5;
    const currentTime = `${currentHour
      .toString()
      .padStart(2, "0")}:${roundedMinute.toString().padStart(2, "0")}`;

    // 24:00 슬롯은 현재 시간이 될 수 없음
    if (slotTime === "24:00") {
      return { isDisabled: false, isCurrentTime: false };
    }

    // 시간을 분 단위로 변환하여 정확한 비교
    const isDisabled =
      timeStringToMinutes(slotTime) < timeStringToMinutes(currentTime);
    const isCurrentTime = slotTime === currentTime;

    return { isDisabled, isCurrentTime };
  };

  /**
   * 모든 시간 슬롯의 상태를 체크하고 업데이트합니다.
   *
   * @param slots - 상태를 체크할 시간 슬롯 배열
   * @returns 상태가 업데이트된 시간 슬롯 배열
   */
  const checkSlotStatus = useCallback(
    (slots: TimeSlot[]): TimeSlot[] => {
      const now = new Date();
      const selectedDateObj = new Date(selectedDate);
      const isToday = selectedDateObj.toDateString() === now.toDateString();

      return slots.map((slot) => {
        const slotDateTime = getSlotDateTime(slot.time);
        const { isReserved, isReservationStart } =
          checkReservationStatus(slotDateTime);
        const { isDisabled, isCurrentTime } = checkTimeStatus(
          slot.time,
          isToday
        );

        return {
          ...slot,
          isReserved,
          isDisabled,
          isCurrentTime,
          isReservationStart,
        };
      });
    },
    [selectedDate, reservations]
  );

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
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const roundedMinute = Math.floor(currentMinute / 5) * 5;
      const currentTime = `${currentHour
        .toString()
        .padStart(2, "0")}:${roundedMinute.toString().padStart(2, "0")}`;

      setTimeout(() => {
        const targetElement = document.querySelector(
          `[data-time="${currentTime}"]`
        );
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 200); // 스크롤 시간을 조금 더 늘림
    }
  }, [selectedDate, reservations, checkSlotStatus]);

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

    // 예약된 시간인 경우 (시작점 제외)
    if (slot.isReserved && !slot.isReservationStart) {
      return;
    }

    // 비활성화된 시간인 경우
    if (slot.isDisabled) {
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
        return;
      }

      setSelectedTimes(startTime, endTime);
    } else {
      setSelectedTimes(time, null);
    }
  };

  // 마우스 이벤트 핸들러
  const handleMouseEnter = (time: string, event: React.MouseEvent) => {
    setHoveredTime(time);

    const slot = timeSlots.find((s) => s.time === time);
    if (slot) {
      const rect = event.currentTarget.getBoundingClientRect();
      const message =
        slot.isReserved && !slot.isReservationStart
          ? t("timetable.reservedTime", { time: slot.time })
          : slot.isReservationStart
          ? t("timetable.reservationStart", { time: slot.time })
          : slot.isCurrentTime
          ? t("timetable.currentTime", { time: slot.time })
          : slot.isDisabled
          ? t("timetable.pastTime", { time: slot.time })
          : slot.time;

      setTooltip({
        message,
        x: rect.left + rect.width / 2,
        y: rect.top - 30,
        isBelow: false,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
    setTooltip(null);
  };

  // 터치 이벤트 핸들러 (모바일용)
  const handleTouchStart = (time: string) => {
    // 터치 시작 시 툴팁 표시
    const slot = timeSlots.find((s) => s.time === time);
    if (slot) {
      const message =
        slot.isReserved && !slot.isReservationStart
          ? t("timetable.reservedTime", { time: slot.time })
          : slot.isReservationStart
          ? t("timetable.reservationStart", { time: slot.time })
          : slot.isCurrentTime
          ? t("timetable.currentTime", { time: slot.time })
          : slot.isDisabled
          ? t("timetable.pastTime", { time: slot.time })
          : slot.time;

      setTooltip({
        message,
        x: 0,
        y: 0,
        isBelow: true,
      });
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => setTooltip(null), 2000); // 2초 후 툴팁 숨김
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

    // 지속 시간 계산
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    // 24시간을 넘어가는 경우 처리
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }

    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    let durationStr = "";
    if (hours > 0 && minutes > 0) {
      durationStr = ` (${hours}시간 ${minutes}분)`;
    } else if (hours > 0) {
      durationStr = ` (${hours}시간)`;
    } else {
      durationStr = ` (${minutes}분)`;
    }

    return (
      t("timetable.timeRange", {
        startTime: `${dateLabel} ${startTime}`,
        endTime,
      }) + durationStr
    );
  };

  // 시간을 1시간 단위로 그룹화 (00:00부터 23:00까지, 24:00은 별도 그룹)
  const groupedSlots = timeSlots.reduce((groups, slot) => {
    // 24:00은 별도 그룹으로 처리
    if (slot.time === "24:00") {
      if (!groups["24"]) {
        groups["24"] = [];
      }
      groups["24"].push(slot);
    } else {
      const hour = slot.time.split(":")[0];
      if (!groups[hour]) {
        groups[hour] = [];
      }
      groups[hour].push(slot);
    }
    return groups;
  }, {} as Record<string, TimeSlot[]>);

  // 오늘 날짜일 때 지난 시간 rows 제거
  const filteredGroupedSlots = (() => {
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    const isToday = selectedDateObj.toDateString() === now.toDateString();

    if (!isToday) {
      return groupedSlots;
    }

    const currentHour = now.getHours();
    const filteredGroups: Record<string, TimeSlot[]> = {};

    Object.entries(groupedSlots).forEach(([hour, slots]) => {
      const hourNum = parseInt(hour);
      // 현재 시간 이후의 시간대만 포함 (24:00은 항상 포함)
      if (hour === "24" || hourNum >= currentHour) {
        filteredGroups[hour] = slots;
      }
    });

    return filteredGroups;
  })();

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

      <div
        className={`rounded-t-lg p-3 mb-0 border ${
          selectedStartTime && selectedEndTime
            ? "bg-primary/5 border-primary"
            : "bg-muted border-border"
        }`}
      >
        {selectedStartTime && !selectedEndTime && (
          <p className="text-sm font-medium text-foreground">
            {t("timetable.selectedTime", { time: selectedStartTime })}
          </p>
        )}
        {selectedStartTime && selectedEndTime && (
          <p className="text-sm font-medium text-foreground ">
            {formatSelectedTime(selectedStartTime, selectedEndTime)}
          </p>
        )}
        {!selectedStartTime && (
          <p className="text-sm font-medium text-foreground">
            {t("timetable.selectTime")}
          </p>
        )}
      </div>

      <div
        className="max-h-60 w-full overflow-x-auto border-l border-r border-b border-border p-4"
        style={{ overflowY: "auto" }}
      >
        {/* 색상 설명 */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <div className="w-3 h-3 bg-muted rounded border border-border"></div>
            <span>{t("ships.availableTime")}</span>
          </div>
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <div className="w-3 h-3 bg-[var(--color-warning-600)]/30 rounded border border-border"></div>
            <span>{t("ships.currentTime")}</span>
          </div>
          {selectedStartTime && selectedEndTime ? (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <div className="w-3 h-3 bg-primary rounded border border-border"></div>
              <span>{t("ships.selectedTime")}</span>
            </div>
          ) : selectedStartTime && !selectedEndTime ? (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <div className="w-3 h-3 bg-[var(--color-success-100)] rounded border border-border"></div>
              <span>{t("ships.selectingTime")}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <div className="w-3 h-3 bg-primary rounded border border-border"></div>
              <span>{t("ships.selectedTime")}</span>
            </div>
          )}
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <div className="w-3 h-3 bg-destructive/20 rounded border border-border"></div>
            <span>{t("ships.reservedTime")}</span>
          </div>
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <div className="w-3 h-3 bg-muted-foreground/50 rounded border border-border"></div>
            <span>{t("ships.pastTime")}</span>
          </div>
        </div>

        <div className="space-y-1">
          {/* 시간대별 행들 */}
          {Object.entries(filteredGroupedSlots)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([hour, slots]) => {
              return (
                <div key={hour}>
                  <div className="relative">
                    {/* 시간 라벨 - 슬롯 위에 오버레이 */}
                    <div className="absolute top-1 left-1 z-10 text-sm font-medium text-foreground bg-background/20 backdrop-blur-sm px-1 rounded-br pointer-events-none">
                      {hour === "24" ? "24:00" : `${hour}:00`}
                    </div>

                    {/* 5분 단위 버튼들 */}
                    <div className="flex w-full">
                      {slots.map((slot, index) => {
                        const isFirst = index === 0;
                        const isLast = index === slots.length - 1;

                        return (
                          <button
                            key={slot.time}
                            data-time={slot.time}
                            onClick={() => handleTimeClick(slot.time)}
                            onMouseEnter={(e) => handleMouseEnter(slot.time, e)}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={() => handleTouchStart(slot.time)}
                            onTouchEnd={handleTouchEnd}
                            disabled={false}
                            className={`h-8 flex-1 text-xs border-y border-border cursor-pointer transition-all duration-200 flex items-center justify-center relative group ${
                              isFirst
                                ? "border-l border-l-border rounded-l-md"
                                : "border-l border-l-border"
                            } ${
                              isLast
                                ? "border-r border-r-border rounded-r-md"
                                : ""
                            } ${
                              selectedStartTime && selectedEndTime
                                ? slot.time >= selectedStartTime &&
                                  slot.time < selectedEndTime
                                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                                  : slot.time === selectedStartTime
                                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                                  : slot.time === selectedEndTime
                                  ? "bg-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/80"
                                  : slot.isDisabled
                                  ? "bg-muted-foreground/50 text-muted-foreground"
                                  : slot.isReserved
                                  ? "bg-destructive/20 text-destructive/60 hover:bg-destructive/30"
                                  : slot.isCurrentTime
                                  ? "bg-[var(--color-warning-600)]/30 text-foreground border-[var(--color-warning-600)]/50 hover:bg-[var(--color-warning-600)]/40"
                                  : hoveredTime === slot.time
                                  ? "bg-[var(--color-success-100)] hover:bg-[var(--color-success-200)] hover:scale-105"
                                  : "bg-muted hover:bg-muted/80 hover:scale-105"
                                : selectedStartTime && !selectedEndTime
                                ? slot.time === selectedStartTime
                                  ? "bg-[var(--color-success-100)] text-[var(--color-success-800)] hover:bg-[var(--color-success-200)]"
                                  : hoveredTime && selectedStartTime
                                  ? (() => {
                                      const startTime = selectedStartTime;
                                      const endTime = hoveredTime;
                                      const slotTime = slot.time;
                                      if (startTime < endTime) {
                                        return slotTime >= startTime &&
                                          slotTime < endTime
                                          ? "bg-[var(--color-success-100)] text-[var(--color-success-800)] hover:bg-[var(--color-success-200)]"
                                          : slotTime === endTime
                                          ? "bg-[var(--color-success-100)] text-[var(--color-success-800)] hover:bg-[var(--color-success-200)]"
                                          : slot.isDisabled
                                          ? "bg-muted-foreground/50 text-muted-foreground"
                                          : slot.isReserved
                                          ? "bg-destructive/20 text-destructive/60 hover:bg-destructive/30"
                                          : slot.isCurrentTime
                                          ? "bg-[var(--color-warning-600)]/30 text-foreground border-[var(--color-warning-600)]/50 hover:bg-[var(--color-warning-600)]/40"
                                          : "bg-muted hover:bg-muted/80 hover:scale-105";
                                      } else {
                                        return slotTime >= endTime &&
                                          slotTime < startTime
                                          ? "bg-[var(--color-success-100)] text-[var(--color-success-800)] hover:bg-[var(--color-success-200)]"
                                          : slotTime === endTime
                                          ? "bg-[var(--color-success-100)] text-[var(--color-success-800)] hover:bg-[var(--color-success-200)]"
                                          : slot.isDisabled
                                          ? "bg-muted-foreground/50 text-muted-foreground"
                                          : slot.isReserved
                                          ? "bg-destructive/20 text-destructive/60 hover:bg-destructive/30"
                                          : slot.isCurrentTime
                                          ? "bg-[var(--color-warning-600)]/30 text-foreground border-[var(--color-warning-600)]/50 hover:bg-[var(--color-warning-600)]/40"
                                          : "bg-muted hover:bg-muted/80 hover:scale-105";
                                      }
                                    })()
                                  : slot.isDisabled
                                  ? "bg-muted-foreground/50 text-muted-foreground"
                                  : slot.isReserved
                                  ? "bg-destructive/20 text-destructive/60 hover:bg-destructive/30"
                                  : slot.isCurrentTime
                                  ? "bg-[var(--color-warning-600)]/30 text-foreground border-[var(--color-warning-600)]/50 hover:bg-[var(--color-warning-600)]/40"
                                  : "bg-muted hover:bg-muted/80 hover:scale-105"
                                : slot.isDisabled
                                ? "bg-muted-foreground/50 text-muted-foreground"
                                : slot.isCurrentTime
                                ? "bg-[var(--color-warning-600)]/30 text-foreground border-[var(--color-warning-600)]/50 hover:bg-[var(--color-warning-600)]/40"
                                : slot.isReserved
                                ? "bg-destructive/20 text-destructive/60 hover:bg-destructive/30"
                                : hoveredTime && slot.time === hoveredTime
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "bg-muted hover:bg-muted/80 hover:scale-105"
                            }`}
                          ></button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 수동 시간 입력 - 임시로 숨김 */}
      {false && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs text-muted-foreground mb-2">
            {t("timetable.manualTimeInput")}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={manualStartTime}
              onChange={(e) => setManualStartTime(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="시작 시간"
            />
            <span className="text-xs text-muted-foreground">~</span>
            <input
              type="time"
              value={manualEndTime}
              onChange={(e) => setManualEndTime(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="종료 시간"
            />
            <button
              onClick={() =>
                handleManualTimeInput(manualStartTime, manualEndTime)
              }
              disabled={!manualStartTime || !manualEndTime}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              {t("timetable.apply")}
            </button>
          </div>
        </div>
      )}

      {/* 툴팁 */}
      {tooltip && (
        <Tooltip
          message={tooltip.message}
          x={tooltip.x}
          y={tooltip.y}
          isBelow={tooltip.isBelow}
        />
      )}
    </div>
  );
}
