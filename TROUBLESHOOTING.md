# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: Dependencies Won't Install

If `bun install` fails with network errors:

**Solution:**
```bash
# Try with npm instead
npm install --legacy-peer-deps
```

### Issue 2: Backend Won't Start

**Symptoms:**
- Error: `Cannot find module 'elysia'`
- Import errors from `@repo/shared-types`

**Solution:**
```bash
# Install dependencies first
cd /path/to/nexus
bun install

# Then start the backend
cd apps/api
bun run dev
```

### Issue 3: Frontend Won't Build/Start

**Symptoms:**
- TypeScript errors
- Import errors from `@repo/client-core`
- Vite build failures

**Solution:**
```bash
# Make sure dependencies are installed
cd /path/to/nexus
bun install

# Then start the frontend
cd apps/web
bun run dev
```

### Issue 4: WebSocket Connection Fails

**Symptoms:**
- Frontend shows "Disconnected" status
- Console shows WebSocket connection errors

**Solutions:**
1. Make sure backend is running on port 3000
2. Check the WebSocket URL in the frontend code
3. Disable any browser extensions that might block WebSockets

### Issue 5: Camera/Microphone Not Working

**Symptoms:**
- "Permission denied" errors
- No video/audio stream shown

**Solutions:**
1. Grant camera/microphone permissions in your browser
2. Use HTTPS or localhost (required by browsers)
3. Check if another app is using the camera

### Issue 6: Calls Don't Connect

**Symptoms:**
- Users can connect but video/audio doesn't work
- ICE candidate errors in console

**Solutions:**
1. Both users must be connected to WebSocket server
2. Check browser console for WebRTC errors
3. Try disabling VPN or firewall temporarily
4. Some corporate networks block WebRTC

## Quick Diagnostic Steps

### Step 1: Test Backend Alone
```bash
cd apps/api
bun run dev
```

Expected output:
```
🦊 Intercom Server running at localhost:3000
```

If this fails, the issue is with the backend setup.

### Step 2: Test with Standalone Demo
1. Make sure backend is running (Step 1)
2. Open `test-demo.html` in your browser
3. Open browser console (F12)
4. Enter a user ID and click "Connect"
5. Check for WebSocket connection in console

If WebSocket connects, backend is working.

### Step 3: Test Full React App
```bash
# Terminal 1
cd apps/api
bun run dev

# Terminal 2
cd apps/web
bun run dev
```

Open browser to `http://localhost:5173`

### Step 4: Test Call Flow
With two browser windows open to the app:

1. **Window 1**: UserID = "alice", Connect
2. **Window 2**: UserID = "bob", Connect
3. **Window 1**: Target = "bob", Start Call
4. **Window 2**: Accept the call

Watch the browser console for errors.

## Getting Error Details

### Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Share the full error message

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Check if WebSocket connection succeeds

### Backend Logs
Check the terminal where you ran `bun run dev` for error messages.

## Still Not Working?

Please provide:
1. **Which step failed** (backend start, frontend start, WebSocket connection, call connection)
2. **Exact error message** from browser console or terminal
3. **What you tried** (standalone demo or full app)
4. **Browser and version** you're using

This will help identify the specific issue!
