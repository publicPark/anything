"use client";

import { Ship, ShipCabin, CabinReservation } from "@/types/database";
import { CabinDetailContent } from "@/components/CabinDetailContent";

interface TutorialCabinData {
  ship: Ship | null;
  cabin: ShipCabin | null;
  reservations: CabinReservation[];
}

interface TutorialCabinWrapperProps {
  cabinData: TutorialCabinData;
  locale: string;
}

export function TutorialCabinWrapper({ 
  cabinData, 
  locale 
}: TutorialCabinWrapperProps) {
  const { ship, cabin } = cabinData;

  // 데이터가 없는 경우 에러 표시
  if (!ship || !cabin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cabin not found</p>
      </div>
    );
  }

  return (
    <CabinDetailContent
      shipPublicId={ship.public_id}
      cabinPublicId={cabin.public_id}
      tutorialMode={true}
      preloadedData={cabinData}
    />
  );
}
