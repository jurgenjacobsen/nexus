# Audio/Video Call Implementation Guide

## Overview

This implementation provides a complete audio/video calling system for the Nexus intercom application using WebRTC technology. The system supports peer-to-peer audio and video calls with the following features:

- Audio-only or video calls
- Real-time communication
- Mute/unmute audio
- Enable/disable video
- Call accept/reject functionality
- Visual call status indicators

## Architecture

### Backend (API - Elysia/Bun)

**Location**: `apps/api/src/index.ts`

The backend acts as a signaling server for WebRTC connections. It:
- Manages WebSocket connections for real-time messaging
- Routes signaling messages between peers (call requests, WebRTC offers/answers, ICE candidates)
- Maintains a simple in-memory registry of connected clients
- Does not require a database (as requested)

**Key Features**:
- WebSocket-based signaling
- Client connection management
- Message routing between peers
- Support for multiple simultaneous connections

### Shared Types

**Location**: `packages/shared-types/index.ts`

Defines TypeScript interfaces and types shared between frontend and backend:
- `CallState` enum (IDLE, CALLING, RINGING, ACTIVE, ENDED)
- WebRTC message types (Offer, Answer, ICE Candidate)
- Call control types (Request, Response, End)
- Socket event constants

### Client Core (Shared Logic)

**Location**: `packages/client-core/`

Contains the core client-side logic that can be shared across web and desktop apps:

#### `webrtc.ts` - WebRTC Service
- Manages RTCPeerConnection lifecycle
- Handles media stream acquisition (getUserMedia)
- Creates and manages SDP offers/answers
- Manages ICE candidates
- Provides controls for toggling audio/video

#### `index.ts` - Call Store (Zustand)
- Global state management for call functionality
- WebSocket connection management
- Integration with WebRTC service
- Call flow orchestration (initiating, accepting, ending calls)
- Media stream state management

### Frontend (React/Vite)

**Location**: `apps/web/src/`

React-based UI for video calling:

#### `CallInterface.tsx`
- Main call interface component
- User ID management
- Call controls (start, accept, reject, end)
- Video/audio toggle controls
- Incoming call modal

#### `CallInterface.css`
- Comprehensive styling for the call interface
- Responsive video container layout
- Call control buttons
- Status indicators with animations

## Usage Guide

### Starting the Backend

```bash
cd apps/api
bun run dev
```

The backend will start on `http://localhost:3000` with WebSocket endpoint at `ws://localhost:3000/ws`.

### Starting the Frontend

```bash
cd apps/web
bun run dev
```

The frontend will typically start on `http://localhost:5173`.

### Making a Call

1. **User 1** (Alice):
   - Enter user ID: `alice`
   - Click "Connect"
   - Enter target user ID: `bob`
   - Select Video/Audio options
   - Click "Start Call"

2. **User 2** (Bob):
   - Enter user ID: `bob`
   - Click "Connect"
   - Wait for incoming call notification
   - Click "Accept" or "Decline"

3. **During Call**:
   - Toggle audio: Mute/unmute microphone
   - Toggle video: Enable/disable camera
   - End call: Terminates the connection

### Testing Locally

For local testing, you'll need:
1. Two browser windows/tabs (or different browsers)
2. The backend server running
3. The frontend running (accessible from both windows)

**Test Scenario**:
```
Window 1 (Alice):
- UserID: alice
- Connect to server
- Target: bob
- Start call with video + audio

Window 2 (Bob):
- UserID: bob
- Connect to server
- Accept incoming call from alice
- Both streams should be visible
```

## WebRTC Flow

1. **Call Initiation**:
   ```
   Alice → Server: CALL_REQUEST {from: alice, to: bob}
   Server → Bob: CALL_REQUEST
   ```

2. **Call Acceptance**:
   ```
   Bob → Server: CALL_RESPONSE {accepted: true}
   Server → Alice: CALL_RESPONSE
   ```

3. **WebRTC Signaling**:
   ```
   Alice creates offer → Server → Bob
   Bob creates answer → Server → Alice
   ICE candidates exchanged through server
   ```

4. **Media Exchange**:
   - Direct peer-to-peer audio/video streams established
   - Server no longer involved in media transfer

5. **Call Termination**:
   ```
   Either party → Server: CALL_END
   Server → Other party: CALL_END
   Both cleanup WebRTC connections
   ```

## Key Components

### WebSocket Messages

All messages follow this structure:
```json
{
  "type": "call:request" | "call:response" | "webrtc:offer" | "webrtc:answer" | "webrtc:candidate" | "call:end",
  "payload": { /* type-specific data */ }
}
```

### ICE Servers

The implementation uses Google's public STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, you may want to add TURN servers for NAT traversal.

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- HTTPS required for production (getUserMedia requires secure context)
- Camera and microphone permissions

## Security Considerations

1. **No Authentication**: Currently implements no user authentication
2. **No Encryption**: WebSocket messages are not encrypted (use WSS in production)
3. **Media Encryption**: WebRTC streams are encrypted by default (DTLS-SRTP)
4. **No Authorization**: Any user can call any other user

## Future Enhancements

Potential improvements not included in this base implementation:
- User authentication and authorization
- Database integration for user profiles
- Call history and recording
- Screen sharing capability
- Group calls (multi-party)
- TURN server for better NAT traversal
- Push notifications for mobile
- Call quality metrics
- Reconnection logic

## Troubleshooting

### No video/audio
- Check browser permissions for camera/microphone
- Ensure HTTPS (or localhost) is used
- Check browser console for errors

### Connection fails
- Verify backend server is running
- Check WebSocket connection in browser DevTools
- Ensure both users are connected to the same server

### One-way audio/video
- ICE candidate exchange may have failed
- Check firewall/NAT configuration
- May need TURN server for certain network configurations

## Code Structure Summary

```
nexus/
├── apps/
│   ├── api/
│   │   └── src/
│   │       └── index.ts          # WebRTC signaling server
│   └── web/
│       └── src/
│           ├── CallInterface.tsx # Main UI component
│           ├── CallInterface.css # Styles
│           └── App.tsx           # App entry point
├── packages/
│   ├── shared-types/
│   │   └── index.ts              # Shared TypeScript types
│   └── client-core/
│       ├── index.ts              # Call store (Zustand)
│       └── webrtc.ts             # WebRTC service class
```

## Dependencies Added

No new dependencies were added. The implementation uses:
- **Existing**: Elysia (backend), React (frontend), Zustand (state management)
- **Native**: WebRTC APIs (built into modern browsers)
- **Native**: WebSocket (built into browsers and Elysia)

This keeps the implementation lightweight and maintains the current structure.
