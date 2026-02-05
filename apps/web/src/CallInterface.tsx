import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '@repo/client-core';
import { CallState } from '@repo/shared-types';
import './CallInterface.css';

function CallInterface() {
  const [targetUserId, setTargetUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [includeVideo, setIncludeVideo] = useState(true);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    callState,
    localStream,
    remoteStream,
    remoteUserId,
    isVideoEnabled,
    isAudioEnabled,
    initializeWebSocket,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
  } = useCallStore();

  // Initialize WebSocket connection
  const handleInitialize = () => {
    if (currentUserId.trim()) {
      initializeWebSocket(currentUserId);
      setIsInitialized(true);
    }
  };

  // Handle starting a call
  const handleStartCall = () => {
    if (targetUserId.trim()) {
      startCall(targetUserId, includeVideo, includeAudio);
    }
  };

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getStatusBadgeClass = () => {
    switch (callState) {
      case CallState.IDLE:
        return 'idle';
      case CallState.CALLING:
        return 'calling';
      case CallState.RINGING:
        return 'ringing';
      case CallState.ACTIVE:
        return 'active';
      default:
        return 'idle';
    }
  };

  const getStatusText = () => {
    switch (callState) {
      case CallState.IDLE:
        return 'Ready to call';
      case CallState.CALLING:
        return 'Calling...';
      case CallState.RINGING:
        return 'Incoming call';
      case CallState.ACTIVE:
        return 'In call';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="video-call-container">
      <div className="call-interface">
        <div className="status-display">
          <h2>Nexus Video Call</h2>
          <span className={`status-badge ${getStatusBadgeClass()}`}>
            {getStatusText()}
          </span>
        </div>

        {!isInitialized ? (
          <div className="user-id-input">
            <input
              type="text"
              placeholder="Enter your User ID (e.g., user1)"
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInitialize()}
            />
            <button
              className="control-btn primary"
              onClick={handleInitialize}
              disabled={!currentUserId.trim()}
            >
              Connect
            </button>
          </div>
        ) : (
          <>
            {callState === CallState.IDLE && (
              <>
                <div className="user-id-input">
                  <input
                    type="text"
                    placeholder="Enter target User ID (e.g., user2)"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
                  />
                </div>

                <div className="call-options">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="video-checkbox"
                      checked={includeVideo}
                      onChange={(e) => setIncludeVideo(e.target.checked)}
                    />
                    <label htmlFor="video-checkbox">Video</label>
                  </div>
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="audio-checkbox"
                      checked={includeAudio}
                      onChange={(e) => setIncludeAudio(e.target.checked)}
                    />
                    <label htmlFor="audio-checkbox">Audio</label>
                  </div>
                </div>

                <div className="controls">
                  <button
                    className="control-btn primary"
                    onClick={handleStartCall}
                    disabled={!targetUserId.trim()}
                  >
                    📞 Start Call
                  </button>
                </div>
              </>
            )}

            {callState === CallState.CALLING && (
              <div className="controls">
                <button className="control-btn danger" onClick={endCall}>
                  ❌ Cancel
                </button>
              </div>
            )}

            {callState === CallState.ACTIVE && (
              <>
                <div className="video-container">
                  <div className="video-wrapper">
                    <div className="video-label">You</div>
                    {localStream ? (
                      <video ref={localVideoRef} autoPlay muted playsInline />
                    ) : (
                      <div className="video-placeholder">No local stream</div>
                    )}
                  </div>
                  <div className="video-wrapper">
                    <div className="video-label">{remoteUserId || 'Remote'}</div>
                    {remoteStream ? (
                      <video ref={remoteVideoRef} autoPlay playsInline />
                    ) : (
                      <div className="video-placeholder">Connecting...</div>
                    )}
                  </div>
                </div>

                <div className="controls">
                  <button
                    className={`control-btn ${isAudioEnabled ? 'secondary' : 'danger'}`}
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? '🎤 Mute' : '🔇 Unmute'}
                  </button>
                  <button
                    className={`control-btn ${isVideoEnabled ? 'secondary' : 'danger'}`}
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? '📹 Hide Video' : '🚫 Show Video'}
                  </button>
                  <button className="control-btn danger" onClick={endCall}>
                    📞 End Call
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Incoming Call Modal */}
        {callState === CallState.RINGING && (
          <div className="incoming-call-modal">
            <div className="incoming-call-content">
              <h3>📞 Incoming Call</h3>
              <p>
                <strong>{remoteUserId}</strong> is calling you
              </p>
              <div className="incoming-call-actions">
                <button className="control-btn success" onClick={acceptCall}>
                  ✅ Accept
                </button>
                <button className="control-btn danger" onClick={rejectCall}>
                  ❌ Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallInterface;
