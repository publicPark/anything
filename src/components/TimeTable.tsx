"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { CabinReservation } from "@/types/database";
import { useReservationStore } from "@/stores/reservationStore";
import { useI18n } from "@/hooks/useI18n";

interface TimeTableProps {
  selectedDate: string;
  reservations: CabinReservation[];
  className?: string;
}

interface TimeSlot {
  time: string;
  isReserved: boolean;
  isDisabled: boolean;
}

// 상수 정의
const SCROLL_DELAY = 200;
const DEFAULT_INTERVAL = 5;

const INTERVAL_OPTIONS = [
  { value: 5 },
  { value: 10 },
  { value: 15 },
  { value: 30 },
  { value: 60 },
] as const;

export function TimeTable({
  selectedDate,
  reservations,
  className = "",
}: TimeTableProps) {
  const { t } = useI18n();
  const { selectedStartTime, selectedEndTime, setSelectedTimes } = useReservationStore();
  
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Add state for selected interval
  const [selectedInterval, setSelectedInterval] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('timetable-interval');
      return saved ? parseInt(saved, 10) : DEFAULT_INTERVAL;
    }
    return DEFAULT_INTERVAL;
  });

  // 유틸리티 함수들
  const getSelectedDateObj = useCallback(() => new Date(selectedDate), [selectedDate]);
  
  const isToday = useMemo(() => {
    const now = new Date();
    const selectedDateObj = getSelectedDateObj();
    return selectedDateObj.toDateString() === now.toDateString();
  }, [getSelectedDateObj]);

  // 시간을 분으로 변환
  const timeToMinutes = useCallback((time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }, []);

  // 분을 시간으로 변환
  const minutesToTime = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }, []);

  // 시간 슬롯 생성
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += selectedInterval) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push({
          time: timeString,
          isReserved: false,
          isDisabled: false,
        });
      }
    }
    
    return slots;
  }, [selectedInterval]);

  // 예약된 시간 확인 (슬롯 전체 범위 내에 예약이 있는지 확인)
  const checkReservationStatus = useCallback((slotTime: string): boolean => {
    const slotDate = getSelectedDateObj();
    const [hours, minutes] = slotTime.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);
    
    // 슬롯의 종료 시간 계산
    const slotEndDate = new Date(slotDate);
    slotEndDate.setMinutes(slotEndDate.getMinutes() + selectedInterval);
    
    return reservations.some((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      
      // 예약이 슬롯 범위와 겹치는지 확인
      return start < slotEndDate && end > slotDate;
    });
  }, [getSelectedDateObj, selectedInterval, reservations]);

  // 과거 시간 확인
  const isPastTime = useCallback((slotTime: string): boolean => {
    if (!isToday) return false;
    
    const now = new Date();
    const [hours, minutes] = slotTime.split(":").map(Number);
    const slotDateTime = getSelectedDateObj();
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    // 현재 시간이 포함된 슬롯은 과거 시간이 아님
    const slotEndTime = new Date(slotDateTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + selectedInterval);
    
    return slotDateTime < now && now >= slotEndTime;
  }, [isToday, getSelectedDateObj, selectedInterval]);

  // 숨겨야 할 과거 시간 확인 (모든 과거 시간 숨김)
  const shouldHidePastTime = useCallback((slotTime: string): boolean => {
    if (!isToday) return false;
    
    const now = new Date();
    const [hours, minutes] = slotTime.split(":").map(Number);
    const slotDateTime = getSelectedDateObj();
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    // 현재 시간을 선택된 간격 단위로 반올림
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const roundedMinute = Math.floor(currentMinute / selectedInterval) * selectedInterval;
    const currentTime = getSelectedDateObj();
    currentTime.setHours(currentHour, roundedMinute, 0, 0);
    
    // 모든 과거 시간 숨김
    return slotDateTime < currentTime;
  }, [isToday, getSelectedDateObj, selectedInterval]);

  // 현재 시간 확인
  const isCurrentTime = useCallback((slotTime: string): boolean => {
    if (!isToday) return false;
    
    const now = new Date();
    const [hours, minutes] = slotTime.split(":").map(Number);
    const slotDateTime = getSelectedDateObj();
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    // 현재 시간이 이 슬롯 범위 내에 있는지 확인
    const slotEndTime = new Date(slotDateTime);
    slotEndTime.setMinutes(slotEndTime.getMinutes() + selectedInterval);
    
    return now >= slotDateTime && now < slotEndTime;
  }, [isToday, getSelectedDateObj, selectedInterval]);

  // 시간 범위 내 슬롯들 확인
  const getSlotsInRange = useCallback((start: string, end: string): string[] => {
    if (!start || !end) return [];
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    const slots: string[] = [];
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += selectedInterval) {
      slots.push(minutesToTime(minutes));
    }
    
    return slots;
  }, [timeToMinutes, minutesToTime, selectedInterval]);

  // 예약된 시간이 범위 내에 있는지 확인
  const hasReservationInRange = useCallback((start: string, end: string): boolean => {
    const slotsInRange = getSlotsInRange(start, end);
    return slotsInRange.some(slotTime => {
      const slot = timeSlots.find(s => s.time === slotTime);
      return slot?.isReserved || false;
    });
  }, [getSlotsInRange, timeSlots]);

  // 범위 내 클릭 처리
  const handleRangeClick = useCallback((slotTime: string) => {
    const slotMinutes = timeToMinutes(slotTime);
    const startMinutes = timeToMinutes(selectedStartTime!);
    const endMinutes = timeToMinutes(selectedEndTime!);
    
    if (slotMinutes === startMinutes) {
      // 시작 슬롯 클릭
      if (endMinutes - startMinutes === selectedInterval) {
        // 단일 슬롯 선택 → 전체 취소
        setSelectedTimes(null, null);
      } else {
        // 범위 선택 → 시작만 해제
        const newStartTime = minutesToTime(startMinutes + selectedInterval);
        setSelectedTimes(newStartTime, selectedEndTime!);
      }
    } else if (slotMinutes === endMinutes - selectedInterval) {
      // 종료 슬롯 클릭 → 종료만 해제
      const newEndTime = minutesToTime(endMinutes - selectedInterval);
      setSelectedTimes(selectedStartTime!, newEndTime);
    } else {
      // 중간 슬롯 클릭 → 전체 초기화
      setSelectedTimes(null, null);
    }
  }, [selectedStartTime, selectedEndTime, timeToMinutes, minutesToTime, selectedInterval, setSelectedTimes]);

  // 범위 확장 처리
  const handleRangeExtension = useCallback((slotTime: string) => {
    const startMinutes = timeToMinutes(selectedStartTime!);
    const slotMinutes = timeToMinutes(slotTime);
    const slotEndTime = minutesToTime(slotMinutes + selectedInterval);
    
    // 같은 시간을 선택하면 선택 취소
    if (slotMinutes === startMinutes) {
      setSelectedTimes(null, null);
      return;
    }
    
    if (slotMinutes > startMinutes) {
      // 이후 시간 선택 → 범위 확장
      const hasReservation = hasReservationInRange(selectedStartTime!, slotEndTime);
      if (hasReservation) {
        // 예약이 있으면 새로운 시작
        setSelectedTimes(slotTime, slotEndTime);
      } else {
        // 예약이 없으면 범위 확장
        setSelectedTimes(selectedStartTime!, slotEndTime);
      }
    } else {
      // 이전 시간 선택 → 시작 시간 변경
      if (selectedEndTime) {
        const hasReservation = hasReservationInRange(slotTime, selectedEndTime);
        if (hasReservation) {
          // 예약이 있으면 새로운 시작
          setSelectedTimes(slotTime, slotEndTime);
        } else {
          // 예약이 없으면 시작 시간 변경
          setSelectedTimes(slotTime, selectedEndTime);
        }
      } else {
        // 종료 시간이 없으면 새로운 시작
        setSelectedTimes(slotTime, slotEndTime);
      }
    }
  }, [selectedStartTime, selectedEndTime, timeToMinutes, minutesToTime, selectedInterval, hasReservationInRange, setSelectedTimes]);

  // 슬롯 클릭 처리
  const handleSlotClick = useCallback((slotTime: string) => {
    const slot = timeSlots.find(s => s.time === slotTime);
    if (!slot || slot.isReserved || slot.isDisabled) return;

    // 범위 내 클릭 처리
    if (selectedStartTime && selectedEndTime) {
      const slotMinutes = timeToMinutes(slotTime);
      const startMinutes = timeToMinutes(selectedStartTime);
      const endMinutes = timeToMinutes(selectedEndTime);
      
      if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
        handleRangeClick(slotTime);
        return;
      }
    }

    // 범위 확장 처리 (이미 선택된 상태에서 다른 슬롯 클릭)
    if (selectedStartTime) {
      handleRangeExtension(slotTime);
      return;
    }

    // 첫 번째 선택
    const slotEndTime = minutesToTime(timeToMinutes(slotTime) + selectedInterval);
    setSelectedTimes(slotTime, slotEndTime);
  }, [timeSlots, selectedStartTime, selectedEndTime, timeToMinutes, minutesToTime, selectedInterval, handleRangeClick, handleRangeExtension, setSelectedTimes]);

  // 슬롯 호버 처리
  const handleSlotHover = useCallback((slotTime: string) => {
    setHoveredSlot(slotTime);
  }, []);

  const handleSlotLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  // 현재 호버 중인 범위 계산
  const hoverRange = useMemo((): string[] => {
    if (!hoveredSlot || !selectedStartTime) return [];
    
    const startMinutes = timeToMinutes(selectedStartTime);
    const hoverMinutes = timeToMinutes(hoveredSlot);
    
    // 이전/이후 시간 모두 범위 표시
    const rangeStart = Math.min(startMinutes, hoverMinutes);
    const rangeEnd = Math.max(startMinutes, hoverMinutes);
    
    const hoverRange = getSlotsInRange(minutesToTime(rangeStart), minutesToTime(rangeEnd));
    
    // 범위에 예약된 시간이 포함되면 hover 표시 안 함
    if (hasReservationInRange(minutesToTime(rangeStart), minutesToTime(rangeEnd))) {
      return [];
    }
    
    return hoverRange;
  }, [hoveredSlot, selectedStartTime, timeToMinutes, minutesToTime, getSlotsInRange, hasReservationInRange]);

  const hasReservationInHoverRange = useMemo(() => {
    return selectedStartTime ? hasReservationInRange(selectedStartTime, hoveredSlot || "") : false;
  }, [selectedStartTime, hoveredSlot, hasReservationInRange]);

  // 시간 슬롯 업데이트
  useEffect(() => {
    const slots = generateTimeSlots().map(slot => ({
      ...slot,
      isReserved: checkReservationStatus(slot.time),
      isDisabled: isPastTime(slot.time),
    }));
    setTimeSlots(slots);
    
    // 처음에만 현재 시간대로 자동 스크롤
    if (!hasScrolled && isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const roundedMinute = Math.floor(currentMinute / selectedInterval) * selectedInterval;
      const currentTime = `${currentHour.toString().padStart(2, "0")}:${roundedMinute.toString().padStart(2, "0")}`;
      
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-time="${currentTime}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setHasScrolled(true);
        }
      }, SCROLL_DELAY);
    }
  }, [generateTimeSlots, checkReservationStatus, isPastTime, hasScrolled, isToday, selectedInterval]);

  // 색상 정의
  const slotStyles = useMemo(() => ({
    available: "bg-muted",
    selected: "bg-primary",
    reserved: "bg-destructive/20",
    past: "bg-muted-foreground/30"
  }), []);

  return (
    <div className={`${className} border rounded-lg`}>
      {/* 타임테이블 슬롯 섹션 */}
      <div className="overflow-hidden">
        <div className="max-h-80 overflow-y-auto p-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 ${slotStyles.available} rounded border border-border`}></div>
              <span>{t("timetable.availableTime")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 ${slotStyles.selected} rounded border border-border`}></div>
              <span>{t("timetable.selectedTime")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded border border-border ring-2 ring-yellow-500 ring-opacity-50 animate-pulse"></div>
              <span>{t("timetable.currentTime")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 ${slotStyles.reserved} rounded border border-border`}></div>
              <span>{t("timetable.reservedTime")}</span>
            </div>
            {timeSlots.some(slot => slot.isDisabled && !shouldHidePastTime(slot.time)) && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 ${slotStyles.past} rounded border border-border`}></div>
                <span>{t("timetable.pastTime")}</span>
              </div>
            )}
          </div>
          

          {/* Interval selection */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t("timetable.interval")}</span>
              <select
                value={selectedInterval}
                onChange={(e) => {
                  const newInterval = Number(e.target.value);
                  setSelectedInterval(newInterval);
                  localStorage.setItem('timetable-interval', newInterval.toString());
                }}
                className="px-3 py-2 text-sm rounded border border-border transition-all duration-200 whitespace-nowrap bg-muted hover:bg-muted/80 appearance-none cursor-pointer pr-8"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value={undefined}>{t("timetable.interval")}</option>
                {INTERVAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value === 60 
                      ? `1 ${t("timetable.hourUnit")}`
                      : `${option.value} ${t("timetable.minuteUnit")}`
                    }
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">{t("timetable.unitView")}</span>
            </div>
          </div>
          

          <div className="flex flex-wrap gap-x-1 gap-y-2">
            {timeSlots.map((slot) => {
              // input 시간이 슬롯 범위 내에 있는지 확인
              const slotStartMinutes = timeToMinutes(slot.time);
              const slotEndMinutes = slotStartMinutes + selectedInterval;
              const inputStartMinutes = selectedStartTime ? timeToMinutes(selectedStartTime) : -1;
              const inputEndMinutes = selectedEndTime ? timeToMinutes(selectedEndTime) : -1;
              
              const isSelected = (inputStartMinutes >= slotStartMinutes && inputStartMinutes < slotEndMinutes);
              const isInSelectedRange = selectedStartTime && selectedEndTime && 
                slotStartMinutes >= inputStartMinutes && 
                slotStartMinutes < inputEndMinutes;
              const isInHoverRange = hoverRange.includes(slot.time);
              const isHovered = hoveredSlot === slot.time;
              const isCurrent = isCurrentTime(slot.time);
              const shouldHide = shouldHidePastTime(slot.time);
              
              // 숨겨야 할 슬롯은 렌더링하지 않음
              if (shouldHide) return null;
              
              // 슬롯 시간 범위 표시
              const slotEndTime = minutesToTime(timeToMinutes(slot.time) + selectedInterval);
              const slotTimeRange = `${slot.time} - ${slotEndTime}`; // 
              
              // 툴팁 메시지 생성
              const getTooltipMessage = () => {
                if (slot.isReserved) return t("timetable.reservedTime");
                if (slot.isDisabled) return t("timetable.pastTime");
                if (isCurrent) return t("timetable.currentTime");
                if (selectedStartTime && !selectedEndTime && hoveredSlot) {
                  const hoverMinutes = timeToMinutes(hoveredSlot);
                  const startMinutes = timeToMinutes(selectedStartTime);
                  if (hoverMinutes > startMinutes) {
                    return `${selectedStartTime} ~ ${hoveredSlot}`;
                  }
                }
                return slotTimeRange;
              };

              return (
                <button
                  key={slot.time}
                  data-time={slot.time}
                  onClick={() => handleSlotClick(slot.time)}
                  onMouseEnter={() => handleSlotHover(slot.time)}
                  onMouseLeave={handleSlotLeave}
                  disabled={slot.isReserved || slot.isDisabled}
                  title={getTooltipMessage()}
                  className={`
                    px-3 py-2 text-sm rounded border border-border transition-all duration-200 whitespace-nowrap
                    ${isCurrent ? 'ring-2 ring-yellow-500 ring-opacity-50 animate-pulse' : ''}
                    ${slot.isReserved 
                      ? "bg-destructive/20 text-destructive cursor-not-allowed" 
                      : slot.isDisabled
                      ? "bg-muted-foreground/30 text-muted-foreground cursor-not-allowed"
                      : isSelected
                      ? "bg-primary text-primary-foreground"
                      : isInSelectedRange
                      ? "bg-primary/80 text-primary-foreground"
                      : isInHoverRange
                      ? hasReservationInHoverRange
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/40 text-primary-foreground"
                      : isHovered
                      ? "bg-primary/20 text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                    }
                  `}
                >
                  {slotTimeRange}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 시간 선택 상태 표시 */}
      <div className="p-4 bg-muted/30 border-t">
        {selectedStartTime && selectedEndTime ? (
          <div className="text-sm text-foreground">
            {/* <span className="font-medium">{t("timetable.reservationTime")}: </span> */}
            <span className="text-foreground font-bold">{selectedStartTime} - {selectedEndTime}</span>
            <span className="text-muted-foreground ml-2">
              ({(() => {
                const startMinutes = timeToMinutes(selectedStartTime);
                const endMinutes = timeToMinutes(selectedEndTime);
                const totalMinutes = endMinutes - startMinutes;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                
                if (hours > 0 && minutes > 0) {
                  return t("timetable.totalTimeWithMinutes", { hours, minutes });
                } else if (hours > 0) {
                  return t("timetable.totalTimeHours", { hours });
                } else {
                  return t("timetable.totalTimeMinutes", { minutes });
                }
              })()})
            </span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {t("timetable.selectTime")}
          </div>
        )}
      </div>
    </div>
  );
}