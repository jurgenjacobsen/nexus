import type { HouseholdConfig, RoomStatus } from '@repo/shared-types';
import { SOCKET_EVENTS } from '@repo/shared-types';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load all household configs from the households directory
function loadHouseholds(): Map<string, HouseholdConfig> {
  const households = new Map<string, HouseholdConfig>();
  const dir = join(import.meta.dir, 'households');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const config: HouseholdConfig = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    households.set(config.householdId, config);
  }
  return households;
}

const households = loadHouseholds();
console.log(`Loaded ${households.size} household config(s)`);

// Active connections: key = `${householdId}:${roomId}`, value = WebSocket
const peers = new Map<string, any>();

function broadcastRoomStatus(householdId: string): void {
  const config = households.get(householdId);
  if (!config) return;

  const statuses: RoomStatus[] = config.rooms.map((room) => ({
    roomId: room.id,
    name: room.name,
    extension: room.extension,
    online: peers.has(`${householdId}:${room.id}`),
  }));

  // Send to every connected room in this household
  for (const room of config.rooms) {
    const key = `${householdId}:${room.id}`;
    const ws = peers.get(key);
    if (ws) {
      ws.send(JSON.stringify({ type: SOCKET_EVENTS.ROOM_STATUS, rooms: statuses }));
    }
  }
}

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    // REST endpoint: GET /households — list available households
    if (url.pathname === '/households' && req.method === 'GET') {
      const list = Array.from(households.values()).map((h) => ({
        householdId: h.householdId,
        name: h.name,
        rooms: h.rooms,
      }));
      return new Response(JSON.stringify(list), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (server.upgrade(req)) {
      return;
    }
    return new Response('Nexus Household Signaling Server. Use a WebSocket client.');
  },
  websocket: {
    open(ws: any) {
      ws.data = { id: crypto.randomUUID().slice(0, 8), householdId: null, roomId: null };
      console.log(`Socket connected: ${ws.data.id}`);
    },
    message(ws: any, message: any) {
      const data = JSON.parse(String(message));

      // Room registration: client tells us which household + room it is
      if (data.type === SOCKET_EVENTS.REGISTER) {
        const { householdId, roomId } = data;
        const config = households.get(householdId);
        if (!config || !config.rooms.find((r) => r.id === roomId)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid household or room' }));
          return;
        }
        ws.data.householdId = householdId;
        ws.data.roomId = roomId;
        const key = `${householdId}:${roomId}`;
        peers.set(key, ws);
        console.log(`Room registered: ${key}`);

        const room = config.rooms.find((r) => r.id === roomId)!;
        ws.send(JSON.stringify({ type: 'registered', householdId, roomId, roomName: room.name }));

        broadcastRoomStatus(householdId);
        return;
      }

      // For all other messages, route to the target room in the same household
      if (data.targetRoomId && ws.data.householdId) {
        const targetKey = `${ws.data.householdId}:${data.targetRoomId}`;
        const targetWs = peers.get(targetKey);
        if (targetWs) {
          targetWs.send(
            JSON.stringify({
              ...data,
              senderRoomId: ws.data.roomId,
            }),
          );
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `Room ${data.targetRoomId} is not online` }));
        }
      }
    },
    close(ws: any) {
      if (ws.data.householdId && ws.data.roomId) {
        const key = `${ws.data.householdId}:${ws.data.roomId}`;
        peers.delete(key);
        console.log(`Room disconnected: ${key}`);
        broadcastRoomStatus(ws.data.householdId);
      }
    },
  },
});

console.log(`Nexus signaling server running on port ${server.port}`);