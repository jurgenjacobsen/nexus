export type User = {
  id: string;
  name: string;
  extension: number;
};

export type Room = {
  id: string;
  name: string;
  extension: number;
};

export type HouseholdConfig = {
  householdId: string;
  name: string;
  rooms: Room[];
};

export type RoomStatus = {
  roomId: string;
  name: string;
  extension: number;
  online: boolean;
};

export type CallMode = 'video' | 'audio';

export const SOCKET_EVENTS = {
  REGISTER: "room:register",
  ROOM_STATUS: "room:status",
  CALL_REQUEST: "call:request",
  CALL_ACCEPT: "call:accept",
  CALL_DECLINE: "call:decline",
  CALL_END: "call:end",
  ICE_CANDIDATE: "webrtc:candidate",
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
} as const;