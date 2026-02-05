import { create } from 'zustand';
import { SOCKET_EVENTS } from '@repo/shared-types';

// Example Store
export const useCallStore = create((set) => ({
  inCall: false,
  startCall: () => {
    console.log(`Triggering event: ${SOCKET_EVENTS.CALL_REQUEST}`);
    set({ inCall: true });
  }
})) as () => { inCall: boolean; startCall: () => void };