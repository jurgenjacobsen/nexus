export type User = {
  id: string;
  name: string;
  extension: number;
};

export const SOCKET_EVENTS = {
  CALL_REQUEST: "call:request",
  ICE_CANDIDATE: "webrtc:candidate"
} as const;