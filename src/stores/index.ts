// Store exports
export { useProfileStore, useProfile, useProfileActions } from "./profileStore";
export {
  useShipStore,
  useCurrentShip,
  useShipActions,
  useShipUI,
  type ShipWithDetails,
  type ShipMemberRequestWithProfile,
} from "./shipStore";

// Store 초기화 함수
export const initializeStores = () => {
  // 필요한 경우 여기서 store 초기화 로직을 추가할 수 있습니다
  console.log("Stores initialized");
};
