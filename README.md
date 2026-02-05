# Nexus
Nexus is a next-generation smart intercom system that transforms every room into a connected hub. Going beyond simple voice commands, it integrates high-definition video calling with a robust internal phone extension network. 
Whether you are calling the kitchen from the garage or routing an external call to a specific bedroom, Nexus offers granular control with personalized profiles and custom ringtones for every zone in your house.

## 🎥 Audio/Video Calling

This repository now includes a complete WebRTC-based audio and video calling system.

### Quick Start

1. **Start the backend server:**
   ```bash
   cd apps/api
   bun run dev
   ```

2. **Start the web frontend:**
   ```bash
   cd apps/web
   bun run dev
   ```

3. **Or use the standalone demo:**
   - Open `test-demo.html` in two browser windows
   - Enter different user IDs in each window
   - Make a call!

### Documentation

- 📖 [**Implementation Guide**](AUDIO_VIDEO_CALL_GUIDE.md) - How the system works
- 🏗️ [**Architecture**](ARCHITECTURE.md) - System design and data flow
- 🧪 [**Testing Guide**](TESTING.md) - How to test the calling features
- 📋 [**Implementation Summary**](IMPLEMENTATION_SUMMARY.md) - What was built
- 🔧 [**Troubleshooting**](TROUBLESHOOTING.md) - Common issues and solutions

### Debugging Tools

- `test-demo.html` - Full-featured standalone demo
- `websocket-test.html` - Simple WebSocket connection test

### Features

- ✅ Audio and video calls between users
- ✅ Mute/unmute audio
- ✅ Enable/disable video
- ✅ Accept/reject incoming calls
- ✅ Real-time WebRTC peer-to-peer connections
- ✅ No database required (in-memory state)

## Development

This is a monorepo using Bun and Turbo:

```bash
# Install dependencies
bun install

# Run all apps in development mode
bun run dev

# Build all apps
bun run build
```
