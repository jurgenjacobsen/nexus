import { Elysia } from "elysia";
import { SOCKET_EVENTS } from "@repo/shared-types";

const app = new Elysia()
  .ws('/ws', {
    message(ws, message) {
      console.log("Msg received:", message);
      if (message === SOCKET_EVENTS.CALL_REQUEST) {
        ws.send("Ringing...");
      }
    }
  })
  .listen(3000);

console.log(`🦊 Intercom Server running at ${app.server?.hostname}:${app.server?.port}`);