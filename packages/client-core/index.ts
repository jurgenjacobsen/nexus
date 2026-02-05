import { create } from 'zustand';
import { 
  SOCKET_EVENTS, 
  CallState, 
  CallRequest, 
  CallResponse,
  CallEnd,
  WebRTCOffer,
  WebRTCAnswer,
  WebRTCIceCandidate
} from '@repo/shared-types';
import { WebRTCService } from './webrtc';

interface CallStore {
  // State
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  currentUserId: string;
  remoteUserId: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  ws: WebSocket | null;
  webrtcService: WebRTCService | null;
  
  // Actions
  initializeWebSocket: (userId: string, wsUrl?: string) => void;
  startCall: (targetUserId: string, hasVideo: boolean, hasAudio: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  
  // Internal methods
  _handleIncomingCall: (request: CallRequest) => void;
  _handleCallResponse: (response: CallResponse) => void;
  _handleWebRTCOffer: (offer: WebRTCOffer) => Promise<void>;
  _handleWebRTCAnswer: (answer: WebRTCAnswer) => Promise<void>;
  _handleIceCandidate: (iceCandidate: WebRTCIceCandidate) => Promise<void>;
  _handleCallEnd: (callEnd: CallEnd) => void;
  _cleanup: () => void;
}

export const useCallStore = create<CallStore>((set, get) => ({
  // Initial state
  callState: CallState.IDLE,
  localStream: null,
  remoteStream: null,
  currentUserId: '',
  remoteUserId: null,
  hasVideo: true,
  hasAudio: true,
  isVideoEnabled: true,
  isAudioEnabled: true,
  ws: null,
  webrtcService: null,

  // Initialize WebSocket connection
  initializeWebSocket: (userId: string, wsUrl = 'ws://localhost:3000/ws') => {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case SOCKET_EVENTS.CALL_REQUEST:
            get()._handleIncomingCall(data.payload);
            break;
          case SOCKET_EVENTS.CALL_RESPONSE:
            get()._handleCallResponse(data.payload);
            break;
          case SOCKET_EVENTS.WEBRTC_OFFER:
            await get()._handleWebRTCOffer(data.payload);
            break;
          case SOCKET_EVENTS.WEBRTC_ANSWER:
            await get()._handleWebRTCAnswer(data.payload);
            break;
          case SOCKET_EVENTS.ICE_CANDIDATE:
            await get()._handleIceCandidate(data.payload);
            break;
          case SOCKET_EVENTS.CALL_END:
            get()._handleCallEnd(data.payload);
            break;
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    set({ ws, currentUserId: userId });
  },

  // Start a call
  startCall: async (targetUserId: string, hasVideo: boolean, hasAudio: boolean) => {
    const { ws, currentUserId } = get();
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    set({ 
      callState: CallState.CALLING,
      remoteUserId: targetUserId,
      hasVideo,
      hasAudio,
      isVideoEnabled: hasVideo,
      isAudioEnabled: hasAudio
    });

    // Send call request
    const callRequest: CallRequest = {
      from: currentUserId,
      to: targetUserId,
      hasVideo,
      hasAudio
    };

    ws.send(JSON.stringify({
      type: SOCKET_EVENTS.CALL_REQUEST,
      payload: callRequest
    }));
  },

  // Accept incoming call
  acceptCall: async () => {
    const { ws, currentUserId, remoteUserId, hasVideo, hasAudio } = get();
    
    if (!ws || !remoteUserId) return;

    // Initialize WebRTC
    const webrtcService = new WebRTCService(
      (candidate) => {
        // Send ICE candidate
        const iceCandidate: WebRTCIceCandidate = {
          from: currentUserId,
          to: remoteUserId,
          candidate: candidate.toJSON()
        };
        ws.send(JSON.stringify({
          type: SOCKET_EVENTS.ICE_CANDIDATE,
          payload: iceCandidate
        }));
      },
      (stream) => {
        // Set remote stream
        set({ remoteStream: stream });
      }
    );

    await webrtcService.initializePeerConnection();
    const localStream = await webrtcService.getUserMedia(hasVideo, hasAudio);

    set({ 
      webrtcService,
      localStream,
      callState: CallState.ACTIVE
    });

    // Send call response
    const callResponse: CallResponse = {
      from: currentUserId,
      to: remoteUserId,
      accepted: true
    };

    ws.send(JSON.stringify({
      type: SOCKET_EVENTS.CALL_RESPONSE,
      payload: callResponse
    }));
  },

  // Reject incoming call
  rejectCall: () => {
    const { ws, currentUserId, remoteUserId } = get();
    
    if (!ws || !remoteUserId) return;

    const callResponse: CallResponse = {
      from: currentUserId,
      to: remoteUserId,
      accepted: false
    };

    ws.send(JSON.stringify({
      type: SOCKET_EVENTS.CALL_RESPONSE,
      payload: callResponse
    }));

    set({ 
      callState: CallState.IDLE,
      remoteUserId: null
    });
  },

  // End the call
  endCall: () => {
    const { ws, currentUserId, remoteUserId } = get();
    
    if (ws && remoteUserId) {
      const callEnd: CallEnd = {
        from: currentUserId,
        to: remoteUserId
      };

      ws.send(JSON.stringify({
        type: SOCKET_EVENTS.CALL_END,
        payload: callEnd
      }));
    }

    get()._cleanup();
  },

  // Toggle video on/off
  toggleVideo: () => {
    const { webrtcService, isVideoEnabled } = get();
    
    if (webrtcService) {
      webrtcService.toggleVideo(!isVideoEnabled);
      set({ isVideoEnabled: !isVideoEnabled });
    }
  },

  // Toggle audio on/off (mute/unmute)
  toggleAudio: () => {
    const { webrtcService, isAudioEnabled } = get();
    
    if (webrtcService) {
      webrtcService.toggleAudio(!isAudioEnabled);
      set({ isAudioEnabled: !isAudioEnabled });
    }
  },

  // Handle incoming call request
  _handleIncomingCall: (request: CallRequest) => {
    set({
      callState: CallState.RINGING,
      remoteUserId: request.from,
      hasVideo: request.hasVideo,
      hasAudio: request.hasAudio
    });
  },

  // Handle call response
  _handleCallResponse: async (response: CallResponse) => {
    if (!response.accepted) {
      // Call was rejected
      get()._cleanup();
      return;
    }

    const { currentUserId, remoteUserId, hasVideo, hasAudio, ws } = get();
    
    if (!remoteUserId || !ws) return;

    // Initialize WebRTC
    const webrtcService = new WebRTCService(
      (candidate) => {
        // Send ICE candidate
        const iceCandidate: WebRTCIceCandidate = {
          from: currentUserId,
          to: remoteUserId,
          candidate: candidate.toJSON()
        };
        ws.send(JSON.stringify({
          type: SOCKET_EVENTS.ICE_CANDIDATE,
          payload: iceCandidate
        }));
      },
      (stream) => {
        // Set remote stream
        set({ remoteStream: stream });
      }
    );

    await webrtcService.initializePeerConnection();
    const localStream = await webrtcService.getUserMedia(hasVideo, hasAudio);

    set({ 
      webrtcService,
      localStream,
      callState: CallState.ACTIVE
    });

    // Create and send offer
    const offer = await webrtcService.createOffer();
    const webrtcOffer: WebRTCOffer = {
      from: currentUserId,
      to: remoteUserId,
      offer
    };

    ws.send(JSON.stringify({
      type: SOCKET_EVENTS.WEBRTC_OFFER,
      payload: webrtcOffer
    }));
  },

  // Handle WebRTC offer
  _handleWebRTCOffer: async (offer: WebRTCOffer) => {
    const { webrtcService, ws, currentUserId, remoteUserId } = get();
    
    if (!webrtcService || !ws || !remoteUserId) return;

    await webrtcService.setRemoteDescription(offer.offer);
    const answer = await webrtcService.createAnswer();

    const webrtcAnswer: WebRTCAnswer = {
      from: currentUserId,
      to: remoteUserId,
      answer
    };

    ws.send(JSON.stringify({
      type: SOCKET_EVENTS.WEBRTC_ANSWER,
      payload: webrtcAnswer
    }));
  },

  // Handle WebRTC answer
  _handleWebRTCAnswer: async (answer: WebRTCAnswer) => {
    const { webrtcService } = get();
    
    if (!webrtcService) return;

    await webrtcService.setRemoteDescription(answer.answer);
  },

  // Handle ICE candidate
  _handleIceCandidate: async (iceCandidate: WebRTCIceCandidate) => {
    const { webrtcService } = get();
    
    if (!webrtcService) return;

    await webrtcService.addIceCandidate(iceCandidate.candidate);
  },

  // Handle call end
  _handleCallEnd: (callEnd: CallEnd) => {
    get()._cleanup();
  },

  // Cleanup resources
  _cleanup: () => {
    const { webrtcService } = get();
    
    if (webrtcService) {
      webrtcService.close();
    }

    set({
      callState: CallState.IDLE,
      localStream: null,
      remoteStream: null,
      remoteUserId: null,
      webrtcService: null,
      isVideoEnabled: true,
      isAudioEnabled: true
    });
  }
}));
export { WebRTCService } from './webrtc';
