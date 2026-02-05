export type User = {
  id: string;
  name: string;
  extension: number;
};

// Call States
export enum CallState {
  IDLE = 'idle',
  CALLING = 'calling',
  RINGING = 'ringing',
  ACTIVE = 'active',
  ENDED = 'ended'
}

// WebRTC Signaling Types
export interface WebRTCOffer {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit;
}

export interface WebRTCAnswer {
  from: string;
  to: string;
  answer: RTCSessionDescriptionInit;
}

export interface WebRTCIceCandidate {
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}

export interface CallRequest {
  from: string;
  to: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface CallResponse {
  from: string;
  to: string;
  accepted: boolean;
}

export interface CallEnd {
  from: string;
  to: string;
}

// Socket Events
export const SOCKET_EVENTS = {
  // Call events
  CALL_REQUEST: "call:request",
  CALL_RESPONSE: "call:response",
  CALL_END: "call:end",
  
  // WebRTC signaling events
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  ICE_CANDIDATE: "webrtc:candidate"
} as const;