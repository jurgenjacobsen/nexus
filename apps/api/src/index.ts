// server.ts
const peers = new Map(); // Stores active connections in memory: { socketId: WebSocket }

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return; // Bun automatically handles the 101 Switching Protocols response
    }
    return new Response("This is a Signaling Server. Use a WebSocket client.");
  },
  websocket: {
    open(ws: any) {
      // Generate a simple random ID for the connected user
      ws.data = { id: crypto.randomUUID().slice(0, 4) };
      peers.set(ws.data.id, ws);
      console.log(`Client connected: ${ws.data.id}`);
      
      // Tell the user their own ID
      ws.send(JSON.stringify({ type: 'me', id: ws.data.id }));
    },
    message(ws: any, message: any) {
      const data = JSON.parse(message);
      
      // Universal routing: Just forward the message to the intended target
      if (data.targetId && peers.has(data.targetId)) {
        const targetWs = peers.get(data.targetId);
        
        // Forward the message but tag who it came from
        targetWs.send(JSON.stringify({
          ...data,
          senderId: ws.data.id
        }));
      } else {
        console.warn(`Target ${data.targetId} not found`);
      }
    },
    close(ws: any) {
      peers.delete(ws.data.id);
      console.log(`Client disconnected: ${ws.data.id}`);
    },
  },
});

console.log(`Signaling server running on port ${server.port}`);