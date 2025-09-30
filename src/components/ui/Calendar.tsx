"use client";

import { useState, useMemo } from "react";
import ReactCalendar from "react-calendar";
import { format, isSameDay } from "date-fns";
import { CabinReservation } from "@/types/database";
import { useI18n } from "@/hooks/useI18n";
import "react-calendar/dist/Calendar.css";

interface CalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  reservations: CabinReservation[];
  className?: string;
}

export function Calendar({
  selectedDate,
  onDateChange,
  reservations,
  className = "",
}: CalendarProps) {
  const { t } = useI18n();

  // 예약이 있는 날짜들을 계산
  const reservationDates = useMemo(() => {
    const dates = new Set<string>();
    reservations.forEach((reservation) => {
      if (reservation.status === "confirmed") {
        const date = new Date(reservation.start_time);
        const dateStr = format(date, "yyyy-MM-dd");
        dates.add(dateStr);
      }
    });
    return dates;
  }, [reservations]);

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 날짜 타일에 예약 표시
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return null;

    const dateStr = format(date, "yyyy-MM-dd");
    const hasReservation = reservationDates.has(dateStr);

    return hasReservation ? (
      <div className="flex justify-center mt-1">
        <div className="w-1 h-1 bg-primary rounded-full"></div>
      </div>
    ) : null;
  };

  // 날짜 선택 가능 여부
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return false;
    return date < today;
  };

  // 선택된 날짜
  const selectedDateObj = new Date(selectedDate);

  return (
    <div className={`${className}`}>
      <ReactCalendar
        value={selectedDateObj}
        onChange={(value) => {
          if (value instanceof Date) {
            const dateStr = format(value, "yyyy-MM-dd");
            onDateChange(dateStr);
          }
        }}
        tileContent={tileContent}
        tileDisabled={tileDisabled}
        minDate={today}
        className="w-full border border-border rounded-lg bg-background text-foreground"
        locale="ko-KR"
      />
      <style jsx global>{`
        .react-calendar {
          background: transparent !important;
          font-family: inherit;
          width: 100% !important;
        }

        .react-calendar__navigation {
          background: transparent !important;
          margin-bottom: 0.5rem;
        }

        .react-calendar__navigation button {
          background: transparent !important;
          color: inherit !important;
          border: none !important;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }

        .react-calendar__navigation button:hover {
          background: hsl(var(--muted)) !important;
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background: hsl(var(--muted)) !important;
        }

        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground)) !important;
        }

        .react-calendar__tile {
          background: transparent !important;
          color: inherit !important;
          border: none !important;
          padding: 0.5rem;
          border-radius: 0.375rem !important;
          transition: all 0.2s;
          position: relative;
          font-weight: normal !important;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background: hsl(var(--muted)) !important;
        }

        /* === 간단한 상태별 스타일 === */

        /* 오늘 날짜 스타일 */
        .react-calendar__tile--now {
          background: var(--warning-100) !important;
          color: #000000 !important;
        }

        /* 선택된 날짜 스타일 */
        .react-calendar__tile--active {
          font-weight: 600 !important;
          border: 2px solid var(--primary) !important;
        }

        /* === 호버/포커스 상태 === */
        .react-calendar__tile--now:enabled:hover,
        .react-calendar__tile--now:enabled:focus {
          background: var(--warning-100) !important;
        }

        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          border-color: var(--primary) !important;
        }

        .react-calendar__tile:disabled {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--muted-foreground)) !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          color: hsl(var(--muted-foreground)) !important;
        }

        /* 예약 표시 점 위치 조정 */
        .react-calendar__tile > div {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
}
