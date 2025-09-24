import { CabinReservation } from "@/types/database";

export type CabinStatus = "available" | "in_use";

export interface CabinWithStatus {
  id: string;
  public_id: string;
  ship_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  currentStatus: CabinStatus;
  currentReservation?: CabinReservation;
  nextReservation?: CabinReservation;
}

/**
 * 현재 시간 기준으로 회의실 상태를 계산합니다.
 * @param reservations 해당 회의실의 모든 예약 목록
 * @returns 회의실 상태 정보
 */
export function calculateCabinStatus(reservations: CabinReservation[]): {
  status: CabinStatus;
  currentReservation?: CabinReservation;
  nextReservation?: CabinReservation;
} {
  const now = new Date();

  // 현재 활성 예약 찾기
  const activeReservation = reservations.find((reservation) => {
    if (reservation.status !== "confirmed") return false;

    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);

    return startTime <= now && now <= endTime;
  });

  // 다음 예약 찾기 (현재 시간 이후의 가장 가까운 예약)
  const nextReservation = reservations
    .filter((reservation) => {
      if (reservation.status !== "confirmed") return false;
      const startTime = new Date(reservation.start_time);
      return startTime > now;
    })
    .sort((a, b) => {
      const aStart = new Date(a.start_time);
      const bStart = new Date(b.start_time);
      return aStart.getTime() - bStart.getTime();
    })[0];

  return {
    status: activeReservation ? "in_use" : "available",
    currentReservation: activeReservation,
    nextReservation,
  };
}

/**
 * 회의실 목록에 상태 정보를 추가합니다.
 * @param cabins 회의실 목록
 * @param reservationsByCabinId 회의실별 예약 목록 (cabin_id를 키로 하는 객체)
 * @returns 상태 정보가 추가된 회의실 목록
 */
export function addStatusToCabins(
  cabins: any[],
  reservationsByCabinId: Record<string, CabinReservation[]>
): CabinWithStatus[] {
  return cabins.map((cabin) => {
    const reservations = reservationsByCabinId[cabin.id] || [];
    const { status, currentReservation, nextReservation } =
      calculateCabinStatus(reservations);

    return {
      ...cabin,
      currentStatus: status,
      currentReservation,
      nextReservation,
    };
  });
}

/**
 * 예약 목록을 회의실별로 그룹화합니다.
 * @param reservations 예약 목록
 * @returns 회의실별 예약 목록 객체
 */
export function groupReservationsByCabinId(
  reservations: CabinReservation[]
): Record<string, CabinReservation[]> {
  return reservations.reduce((acc, reservation) => {
    const cabinId = reservation.cabin_id;
    if (!acc[cabinId]) {
      acc[cabinId] = [];
    }
    acc[cabinId].push(reservation);
    return acc;
  }, {} as Record<string, CabinReservation[]>);
}
