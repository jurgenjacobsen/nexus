import { create } from 'zustand';
import { SOCKET_EVENTS } from '@repo/shared-types';
import type { RoomStatus, CallMode } from '@repo/shared-types';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

export interface CallStore {
  // Connection
  connected: boolean;
  householdId: string | null;
  roomId: string | null;
  roomName: string | null;
  rooms: RoomStatus[];

  // Call state
  callState: CallState;
  callMode: CallMode | null;
  remoteRoomId: string | null;
  remoteRoomName: string | null;
  isMuted: boolean;
  isVideoMuted: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setRegistration: (householdId: string, roomId: string, roomName: string) => void;
  setRooms: (rooms: RoomStatus[]) => void;
  startCall: (targetRoomId: string, targetRoomName: string, mode: CallMode) => void;
  receiveCall: (senderRoomId: string, senderRoomName: string, mode: CallMode) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideoMute: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  connected: false,
  householdId: null,
  roomId: null,
  roomName: null,
  rooms: [],

  callState: 'idle',
  callMode: null,
  remoteRoomId: null,
  remoteRoomName: null,
  isMuted: false,
  isVideoMuted: false,

  setConnected: (connected) => set({ connected }),
  setRegistration: (householdId, roomId, roomName) => set({ householdId, roomId, roomName }),
  setRooms: (rooms) => set({ rooms }),
  startCall: (targetRoomId, targetRoomName, mode) => {
    console.log(`Triggering event: ${SOCKET_EVENTS.CALL_REQUEST}`);
    set({
      callState: 'outgoing',
      callMode: mode,
      remoteRoomId: targetRoomId,
      remoteRoomName: targetRoomName,
      isMuted: false,
      isVideoMuted: false,
    });
  },
  receiveCall: (senderRoomId, senderRoomName, mode) =>
    set({
      callState: 'incoming',
      callMode: mode,
      remoteRoomId: senderRoomId,
      remoteRoomName: senderRoomName,
    }),
  acceptCall: () => set({ callState: 'active', isMuted: false, isVideoMuted: false }),
  declineCall: () =>
    set({ callState: 'idle', callMode: null, remoteRoomId: null, remoteRoomName: null }),
  endCall: () =>
    set({
      callState: 'idle',
      callMode: null,
      remoteRoomId: null,
      remoteRoomName: null,
      isMuted: false,
      isVideoMuted: false,
    }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideoMute: () => set((state) => ({ isVideoMuted: !state.isVideoMuted })),
}));