import { create } from "zustand";

interface ReservationState {
  selectedStartTime: string | null;
  selectedEndTime: string | null;
  setSelectedTimes: (startTime: string | null, endTime: string | null) => void;
  clearSelection: () => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  selectedStartTime: null,
  selectedEndTime: null,
  setSelectedTimes: (startTime, endTime) =>
    set({ selectedStartTime: startTime, selectedEndTime: endTime }),
  clearSelection: () => set({ selectedStartTime: null, selectedEndTime: null }),
}));
