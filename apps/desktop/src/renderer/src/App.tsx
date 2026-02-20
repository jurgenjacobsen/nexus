import { useState, useEffect, useCallback, useRef } from 'react'
import type { RoomStatus, CallMode } from '@repo/shared-types'
import { SOCKET_EVENTS } from '@repo/shared-types'

// ---------- Types ----------
type CallState = 'idle' | 'outgoing' | 'incoming' | 'active'

interface AppState {
  connected: boolean
  householdId: string | null
  roomId: string | null
  roomName: string | null
  rooms: RoomStatus[]
  callState: CallState
  callMode: CallMode | null
  remoteRoomId: string | null
  remoteRoomName: string | null
  isMuted: boolean
  isVideoMuted: boolean
}

const initialState: AppState = {
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
  isVideoMuted: false
}

// ---------- Main App ----------
function App(): React.JSX.Element {
  const [state, setState] = useState<AppState>(initialState)
  const wsRef = useRef<WebSocket | null>(null)

  // Config – in production these would come from a household config file
  const householdId = 'smith-family'
  const availableRooms = [
    { id: 'kitchen', name: 'Kitchen' },
    { id: 'living-room', name: 'Living Room' },
    { id: 'master-bedroom', name: 'Master Bedroom' },
    { id: 'kids-bedroom', name: 'Kids Bedroom' },
    { id: 'garage', name: 'Garage' },
    { id: 'office', name: 'Home Office' }
  ]
  const [selectedRoom, setSelectedRoom] = useState<string>('kitchen')

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  // Connect to signaling server
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')
    wsRef.current = ws

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true }))
      ws.send(
        JSON.stringify({
          type: SOCKET_EVENTS.REGISTER,
          householdId,
          roomId: selectedRoom
        })
      )
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'registered':
          setState((s) => ({
            ...s,
            householdId: data.householdId,
            roomId: data.roomId,
            roomName: data.roomName
          }))
          break

        case SOCKET_EVENTS.ROOM_STATUS:
          setState((s) => ({ ...s, rooms: data.rooms }))
          break

        case SOCKET_EVENTS.CALL_REQUEST: {
          const senderRoom = data.senderRoomId as string
          const senderName = data.senderRoomName as string
          const mode = data.callMode as CallMode
          setState((s) => ({
            ...s,
            callState: 'incoming',
            callMode: mode,
            remoteRoomId: senderRoom,
            remoteRoomName: senderName
          }))
          break
        }

        case SOCKET_EVENTS.CALL_ACCEPT:
          setState((s) => ({
            ...s,
            callState: 'active',
            isMuted: false,
            isVideoMuted: false
          }))
          break

        case SOCKET_EVENTS.CALL_DECLINE:
        case SOCKET_EVENTS.CALL_END:
          setState((s) => ({
            ...s,
            callState: 'idle',
            callMode: null,
            remoteRoomId: null,
            remoteRoomName: null,
            isMuted: false,
            isVideoMuted: false
          }))
          break

        case 'error':
          console.warn('Server error:', data.message)
          break
      }
    }

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false }))
    }

    return () => {
      ws.close()
    }
  }, [selectedRoom, householdId, send])

  // ---------- Call actions ----------
  const startCall = (targetRoomId: string, mode: CallMode): void => {
    const targetRoom = state.rooms.find((r) => r.roomId === targetRoomId)
    if (!targetRoom || !targetRoom.online) return
    setState((s) => ({
      ...s,
      callState: 'outgoing',
      callMode: mode,
      remoteRoomId: targetRoomId,
      remoteRoomName: targetRoom.name,
      isMuted: false,
      isVideoMuted: false
    }))
    send({
      type: SOCKET_EVENTS.CALL_REQUEST,
      targetRoomId,
      senderRoomName: state.roomName,
      callMode: mode
    })
  }

  const acceptCall = (): void => {
    setState((s) => ({ ...s, callState: 'active', isMuted: false, isVideoMuted: false }))
    send({
      type: SOCKET_EVENTS.CALL_ACCEPT,
      targetRoomId: state.remoteRoomId
    })
  }

  const declineCall = (): void => {
    send({
      type: SOCKET_EVENTS.CALL_DECLINE,
      targetRoomId: state.remoteRoomId
    })
    setState((s) => ({
      ...s,
      callState: 'idle',
      callMode: null,
      remoteRoomId: null,
      remoteRoomName: null
    }))
  }

  const endCall = (): void => {
    send({
      type: SOCKET_EVENTS.CALL_END,
      targetRoomId: state.remoteRoomId
    })
    setState((s) => ({
      ...s,
      callState: 'idle',
      callMode: null,
      remoteRoomId: null,
      remoteRoomName: null,
      isMuted: false,
      isVideoMuted: false
    }))
  }

  const toggleMute = (): void => setState((s) => ({ ...s, isMuted: !s.isMuted }))
  const toggleVideoMute = (): void => setState((s) => ({ ...s, isVideoMuted: !s.isVideoMuted }))

  // Rooms the user can call (exclude self, only online)
  const callableRooms = state.rooms.filter((r) => r.roomId !== state.roomId)

  // ---------- Render ----------
  return (
    <div className="nexus-app">
      {/* Header */}
      <header className="nexus-header">
        <h1 className="nexus-title">Nexus Intercom</h1>
        <div className="nexus-status">
          <select
            className="room-select"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={state.callState !== 'idle'}
          >
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <span className={`status-dot ${state.connected ? 'online' : 'offline'}`} />
          <span className="status-label">
            {state.connected ? `${state.roomName ?? 'Connecting…'}` : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Incoming call overlay */}
      {state.callState === 'incoming' && (
        <div className="incoming-overlay">
          <div className="incoming-card">
            <p className="incoming-label">Incoming {state.callMode} call</p>
            <h2 className="incoming-room">{state.remoteRoomName}</h2>
            <div className="incoming-actions">
              <button className="btn btn-accept" onClick={acceptCall}>
                Accept
              </button>
              <button className="btn btn-decline" onClick={declineCall}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active / outgoing call view */}
      {(state.callState === 'active' || state.callState === 'outgoing') && (
        <div className="call-view">
          <div className="call-info">
            <p className="call-label">
              {state.callState === 'outgoing' ? 'Calling…' : `In ${state.callMode} call with`}
            </p>
            <h2 className="call-room">{state.remoteRoomName}</h2>
            <span className="call-mode-badge">{state.callMode}</span>
          </div>
          <div className="call-controls">
            <button
              className={`btn btn-control ${state.isMuted ? 'active' : ''}`}
              onClick={toggleMute}
            >
              {state.isMuted ? 'Unmute' : 'Mute'}
            </button>
            {state.callMode === 'video' && (
              <button
                className={`btn btn-control ${state.isVideoMuted ? 'active' : ''}`}
                onClick={toggleVideoMute}
              >
                {state.isVideoMuted ? 'Show Video' : 'Hide Video'}
              </button>
            )}
            <button className="btn btn-end" onClick={endCall}>
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Room list – shown only when idle */}
      {state.callState === 'idle' && (
        <div className="room-list">
          <h2 className="section-title">Rooms</h2>
          {callableRooms.length === 0 && (
            <p className="empty-msg">No other rooms available</p>
          )}
          {callableRooms.map((room) => (
            <div key={room.roomId} className="room-card">
              <div className="room-info">
                <span className={`status-dot ${room.online ? 'online' : 'offline'}`} />
                <span className="room-name">{room.name}</span>
                <span className="room-ext">ext. {room.extension}</span>
              </div>
              {room.online && (
                <div className="room-actions">
                  <button
                    className="btn btn-video"
                    onClick={() => startCall(room.roomId, 'video')}
                  >
                    Video
                  </button>
                  <button
                    className="btn btn-audio"
                    onClick={() => startCall(room.roomId, 'audio')}
                  >
                    Audio
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
