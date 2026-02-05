# Audio/Video Call Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Nexus Call System                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐                                    ┌──────────────┐
│   User A     │                                    │   User B     │
│  (alice)     │                                    │   (bob)      │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │  ┌─────────────────────────────────────────┐    │
       ├──┤         React Frontend (Web)            │────┤
       │  │  - CallInterface Component               │    │
       │  │  - Video/Audio Controls                  │    │
       │  │  - User Interface                        │    │
       │  └─────────────┬────────────────────────────┘    │
       │                │                                  │
       │  ┌─────────────┴────────────────────────────┐    │
       ├──┤      Client Core (Zustand Store)         │────┤
       │  │  - Call State Management                  │    │
       │  │  - WebSocket Handler                      │    │
       │  │  - WebRTC Service Integration             │    │
       │  └─────────────┬────────────────────────────┘    │
       │                │                                  │
       │  ┌─────────────┴────────────────────────────┐    │
       ├──┤        WebRTC Service                     │────┤
       │  │  - Peer Connection Management             │    │
       │  │  - Media Stream Handling                  │    │
       │  │  - ICE Candidate Management               │    │
       │  └─────────────┬────────────────────────────┘    │
       │                │                                  │
       │         WebSocket (Signaling)                     │
       │                │                                  │
       │  ┌─────────────┴────────────────────────────┐    │
       └──┤    Elysia Backend (Signaling Server)     │────┘
          │  - WebSocket Server                       │
          │  - Message Routing                        │
          │  - Client Registry (In-Memory)            │
          └─────────────────────────────────────────┘

                    Direct P2P Connection
       ┌────────────────────────────────────────────────┐
       │         WebRTC Media Stream (DTLS-SRTP)        │
       │  User A ◄─────────────────────────────► User B │
       │         Audio/Video (Encrypted P2P)             │
       └────────────────────────────────────────────────┘
```

## Call Flow Sequence

### 1. Initialization Phase
```
User A                  Frontend                Backend                User B
  │                        │                       │                      │
  │─────Connect───────────►│                       │                      │
  │                        │────WebSocket Connect──►│                      │
  │                        │◄──────Connected────────│                      │
  │                        │                       │◄─WebSocket Connect───│
  │                        │                       │─────Connected────────►│
```

### 2. Call Request Phase
```
User A                  Frontend A              Backend                Frontend B              User B
  │                        │                       │                       │                      │
  │──Start Call───────────►│                       │                       │                      │
  │                        │──CALL_REQUEST────────►│                       │                      │
  │                        │                       │──CALL_REQUEST────────►│                      │
  │                        │                       │                       │───Incoming Call─────►│
  │                        │                       │                       │◄──Accept────────────│
  │                        │                       │◄──CALL_RESPONSE───────│                      │
  │                        │◄─CALL_RESPONSE────────│                       │                      │
```

### 3. WebRTC Negotiation Phase
```
User A                  Frontend A              Backend                Frontend B              User B
  │                        │                       │                       │                      │
  │                        │─getUserMedia()        │                       │─getUserMedia()       │
  │                        │◄Stream────────        │                       │◄Stream────────       │
  │                        │                       │                       │                      │
  │                        │──WEBRTC_OFFER────────►│                       │                      │
  │                        │                       │──WEBRTC_OFFER────────►│                      │
  │                        │                       │                       │                      │
  │                        │                       │◄──WEBRTC_ANSWER───────│                      │
  │                        │◄─WEBRTC_ANSWER────────│                       │                      │
  │                        │                       │                       │                      │
  │                        │──ICE_CANDIDATE───────►│──ICE_CANDIDATE───────►│                      │
  │                        │◄─ICE_CANDIDATE────────│◄─ICE_CANDIDATE────────│                      │
```

### 4. Active Call Phase
```
User A                                                                                    User B
  │                                                                                          │
  │◄─────────────────────────Direct P2P Audio/Video Stream──────────────────────────────────►│
  │                         (No backend involvement in media)                                │
  │                                                                                          │
  │──Toggle Audio/Video (Local only)                                                        │
  │                                                                                          │
```

### 5. Call Termination Phase
```
User A                  Frontend A              Backend                Frontend B              User B
  │                        │                       │                       │                      │
  │──End Call─────────────►│                       │                       │                      │
  │                        │──CALL_END────────────►│                       │                      │
  │                        │                       │──CALL_END────────────►│                      │
  │                        │─cleanup()             │                       │─cleanup()            │
  │                        │                       │                       │                      │
```

## Component Responsibilities

### Backend (apps/api/src/index.ts)
- **WebSocket Server**: Manages real-time connections
- **Client Registry**: Tracks connected users by ID
- **Message Router**: Forwards signaling messages between peers
- **No Media Processing**: Backend never handles audio/video data

### Shared Types (packages/shared-types/index.ts)
- **Interfaces**: TypeScript interfaces for all message types
- **Enums**: Call states and event types
- **Constants**: Socket event names
- **Type Safety**: Ensures type consistency across frontend/backend

### Client Core (packages/client-core/)

#### webrtc.ts - WebRTC Service
- **Peer Connection**: Creates and manages RTCPeerConnection
- **Media Streams**: Handles getUserMedia for camera/microphone
- **SDP Exchange**: Creates offers and answers
- **ICE Handling**: Manages ICE candidate exchange
- **Media Controls**: Toggle audio/video on/off

#### index.ts - Call Store (Zustand)
- **State Management**: Global call state
- **WebSocket Client**: Manages connection to backend
- **Event Handlers**: Routes incoming signaling messages
- **Call Orchestration**: Coordinates call flow
- **Cleanup**: Resource management on call end

### Frontend (apps/web/src/)

#### CallInterface.tsx
- **User Interface**: Renders call UI
- **User Input**: Handles user IDs and call options
- **Video Display**: Shows local and remote video streams
- **Controls**: Provides mute, video toggle, end call buttons
- **State Display**: Shows call status and incoming call prompts

## Data Flow

### WebSocket Messages (JSON)
All signaling messages follow this structure:
```typescript
{
  type: string,        // Event type (e.g., "call:request")
  payload: object      // Type-specific data
}
```

### Message Types

1. **CALL_REQUEST**
```typescript
{
  type: "call:request",
  payload: {
    from: string,      // Caller user ID
    to: string,        // Callee user ID
    hasVideo: boolean, // Include video?
    hasAudio: boolean  // Include audio?
  }
}
```

2. **CALL_RESPONSE**
```typescript
{
  type: "call:response",
  payload: {
    from: string,      // Responder user ID
    to: string,        // Original caller
    accepted: boolean  // Call accepted?
  }
}
```

3. **WEBRTC_OFFER**
```typescript
{
  type: "webrtc:offer",
  payload: {
    from: string,
    to: string,
    offer: RTCSessionDescriptionInit
  }
}
```

4. **WEBRTC_ANSWER**
```typescript
{
  type: "webrtc:answer",
  payload: {
    from: string,
    to: string,
    answer: RTCSessionDescriptionInit
  }
}
```

5. **ICE_CANDIDATE**
```typescript
{
  type: "webrtc:candidate",
  payload: {
    from: string,
    to: string,
    candidate: RTCIceCandidateInit
  }
}
```

6. **CALL_END**
```typescript
{
  type: "call:end",
  payload: {
    from: string,
    to: string
  }
}
```

## State Management

### Call States (CallState enum)
- **IDLE**: No active call
- **CALLING**: Outgoing call in progress (ringing remote user)
- **RINGING**: Incoming call (user needs to accept/reject)
- **ACTIVE**: Call is connected and media flowing
- **ENDED**: Call terminated (transitions back to IDLE)

### Store State
```typescript
{
  callState: CallState,
  localStream: MediaStream | null,
  remoteStream: MediaStream | null,
  currentUserId: string,
  remoteUserId: string | null,
  hasVideo: boolean,
  hasAudio: boolean,
  isVideoEnabled: boolean,
  isAudioEnabled: boolean,
  ws: WebSocket | null,
  webrtcService: WebRTCService | null
}
```

## Technical Stack

### Backend
- **Elysia**: Fast Bun-based web framework
- **WebSocket**: Built-in Elysia WebSocket support
- **TypeScript**: Type-safe backend code

### Frontend
- **React 19**: Latest React with hooks
- **Zustand**: Lightweight state management
- **Vite**: Fast development build tool
- **TypeScript**: Type-safe frontend code

### WebRTC
- **Native Browser APIs**: No external WebRTC library needed
- **STUN Servers**: Google's public STUN servers
- **Media APIs**: getUserMedia, RTCPeerConnection
- **Encryption**: DTLS-SRTP (built into WebRTC)

## Network Architecture

### Signaling Path (via Backend)
```
User A ─── WebSocket ───► Backend ─── WebSocket ───► User B
```

### Media Path (Direct P2P)
```
User A ═══ WebRTC Direct Connection ═══ User B
       (DTLS-SRTP Encrypted Audio/Video)
```

### NAT Traversal (STUN/TURN)
```
User A ───► STUN Server (Google)
            ↓
            ICE Candidates
            ↓
            Exchange via Backend
            ↓
User B ───► STUN Server (Google)

Result: Direct P2P connection or relayed via TURN
```

## Scalability Considerations

### Current Implementation
- ✅ Simple 1-to-1 calls
- ✅ In-memory client registry
- ✅ Single server instance
- ❌ No database
- ❌ No horizontal scaling
- ❌ No load balancing

### For Production
Would need:
- Database for user sessions
- Redis for distributed client registry
- Load balancer with sticky sessions
- TURN server for NAT traversal
- Media server for group calls
- Recording infrastructure

## Security Model

### Current (Development)
- No authentication
- No authorization
- Plain WebSocket (WS)
- Public STUN servers
- No rate limiting

### Recommended (Production)
- JWT authentication
- User authorization
- Secure WebSocket (WSS)
- Private STUN/TURN servers
- Rate limiting
- Input validation
- Encrypted signaling channel
