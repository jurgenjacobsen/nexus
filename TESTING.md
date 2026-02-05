# Quick Test Guide for Audio/Video Calling

## Quick Start with Standalone Demo

The easiest way to test the audio/video calling functionality is using the standalone HTML demo:

### 1. Start the Backend Server

```bash
cd apps/api
bun run dev
```

The server will start on `http://localhost:3000`

### 2. Test with Standalone Demo

Open `test-demo.html` in two different browser windows (or tabs):

**Window 1 (User Alice):**
1. Open `test-demo.html` in your browser
2. Enter User ID: `alice`
3. Click "Connect"
4. Enter Target ID: `bob`
5. Check/uncheck Video and Audio as desired
6. Click "📞 Call"

**Window 2 (User Bob):**
1. Open `test-demo.html` in another browser window/tab
2. Enter User ID: `bob`
3. Click "Connect"
4. Wait for the incoming call prompt
5. Accept the call

You should now see video/audio streams in both windows!

### 3. Test with React App (Alternative)

If you prefer to test with the full React application:

```bash
# In one terminal - start backend
cd apps/api
bun run dev

# In another terminal - start web app
cd apps/web
bun run dev
```

Then open two browser windows to `http://localhost:5173` and follow similar steps as above.

## Features to Test

- ✅ **Audio-only calls**: Uncheck video, keep audio checked
- ✅ **Video calls**: Both video and audio checked
- ✅ **Mute/Unmute**: Click the microphone button during a call
- ✅ **Video on/off**: Click the camera button during a call
- ✅ **End call**: Click the "End Call" button
- ✅ **Reject call**: Decline an incoming call
- ✅ **Multiple sessions**: Open 3+ windows with different user IDs

## Network Requirements

- **Local testing**: Works on `localhost` without HTTPS
- **Production**: Requires HTTPS for getUserMedia API
- **Firewall**: Ensure port 3000 is accessible
- **Browser**: Use modern browser (Chrome, Firefox, Edge, Safari)

## Troubleshooting

### Camera/Microphone not working
1. Check browser permissions (camera icon in address bar)
2. Ensure you're on HTTPS or localhost
3. Try a different browser

### Connection fails
1. Verify backend is running on port 3000
2. Check browser console for errors
3. Ensure WebSocket connection is established (green "Connected" status)

### One user can't see the other
1. Both users must be connected before calling
2. Ensure both accepted the call
3. Check that WebRTC offer/answer exchange completed (check logs)

### Behind corporate firewall
- May need TURN server configuration
- Some networks block WebRTC entirely
- Try on different network or VPN

## Logs

The demo page includes a log viewer at the bottom showing:
- WebSocket connection status
- Signaling messages
- WebRTC setup progress
- Errors and warnings

Use these logs to debug connection issues.

## Browser Compatibility

| Browser | Version | Supported |
|---------|---------|-----------|
| Chrome  | 70+     | ✅ Yes    |
| Firefox | 65+     | ✅ Yes    |
| Safari  | 12+     | ✅ Yes    |
| Edge    | 79+     | ✅ Yes    |

## Performance Tips

- **Resolution**: Default is 1280x720, can be adjusted in code
- **Network**: Use local network for testing (better quality)
- **CPU**: Video encoding is CPU-intensive, may slow older devices

## Security Notes

⚠️ **This is a base implementation without:**
- User authentication
- Authorization checks
- Encrypted signaling (use WSS in production)
- Rate limiting
- Input validation

**Do NOT deploy this to production without adding security measures!**
