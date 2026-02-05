import { Elysia } from "elysia";
import { 
  SOCKET_EVENTS, 
  CallRequest, 
  CallResponse, 
  CallEnd,
  WebRTCOffer,
  WebRTCAnswer,
  WebRTCIceCandidate
} from "@repo/shared-types";

// Type for connected WebSocket clients
type WSClient = any; // Elysia's WebSocket type

// Store connected clients
const clients = new Map<string, WSClient>();

const app = new Elysia()
  .ws('/ws', {
    open(ws) {
      console.log('Client connected');
    },
    
    close(ws) {
      console.log('Client disconnected');
      // Remove client from clients map
      for (const [id, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(id);
          break;
        }
      }
    },
    
    message(ws, message) {
      console.log("Msg received:", message);
      
      try {
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        
        switch (data.type) {
          case SOCKET_EVENTS.CALL_REQUEST: {
            const callRequest: CallRequest = data.payload;
            console.log(`Call request from ${callRequest.from} to ${callRequest.to}`);
            
            // Store the caller's connection
            clients.set(callRequest.from, ws);
            
            // Find the target client and forward the call request
            const targetClient = clients.get(callRequest.to);
            if (targetClient) {
              targetClient.send(JSON.stringify({
                type: SOCKET_EVENTS.CALL_REQUEST,
                payload: callRequest
              }));
            } else {
              // Target not available
              ws.send(JSON.stringify({
                type: SOCKET_EVENTS.ERROR,
                payload: { message: 'Target user not available' }
              }));
            }
            break;
          }
          
          case SOCKET_EVENTS.CALL_RESPONSE: {
            const callResponse: CallResponse = data.payload;
            console.log(`Call response from ${callResponse.from} to ${callResponse.to}: ${callResponse.accepted ? 'accepted' : 'rejected'}`);
            
            // Store the receiver's connection
            clients.set(callResponse.from, ws);
            
            // Forward response to caller
            const callerClient = clients.get(callResponse.to);
            if (callerClient) {
              callerClient.send(JSON.stringify({
                type: SOCKET_EVENTS.CALL_RESPONSE,
                payload: callResponse
              }));
            }
            break;
          }
          
          case SOCKET_EVENTS.WEBRTC_OFFER: {
            const offer: WebRTCOffer = data.payload;
            console.log(`WebRTC offer from ${offer.from} to ${offer.to}`);
            
            // Forward offer to the target
            const targetClient = clients.get(offer.to);
            if (targetClient) {
              targetClient.send(JSON.stringify({
                type: SOCKET_EVENTS.WEBRTC_OFFER,
                payload: offer
              }));
            }
            break;
          }
          
          case SOCKET_EVENTS.WEBRTC_ANSWER: {
            const answer: WebRTCAnswer = data.payload;
            console.log(`WebRTC answer from ${answer.from} to ${answer.to}`);
            
            // Forward answer to the caller
            const callerClient = clients.get(answer.to);
            if (callerClient) {
              callerClient.send(JSON.stringify({
                type: SOCKET_EVENTS.WEBRTC_ANSWER,
                payload: answer
              }));
            }
            break;
          }
          
          case SOCKET_EVENTS.ICE_CANDIDATE: {
            const iceCandidate: WebRTCIceCandidate = data.payload;
            console.log(`ICE candidate from ${iceCandidate.from} to ${iceCandidate.to}`);
            
            // Forward ICE candidate to the other peer
            const targetClient = clients.get(iceCandidate.to);
            if (targetClient) {
              targetClient.send(JSON.stringify({
                type: SOCKET_EVENTS.ICE_CANDIDATE,
                payload: iceCandidate
              }));
            }
            break;
          }
          
          case SOCKET_EVENTS.CALL_END: {
            const callEnd: CallEnd = data.payload;
            console.log(`Call ended by ${callEnd.from} to ${callEnd.to}`);
            
            // Forward call end to the other peer
            const targetClient = clients.get(callEnd.to);
            if (targetClient) {
              targetClient.send(JSON.stringify({
                type: SOCKET_EVENTS.CALL_END,
                payload: callEnd
              }));
            }
            break;
          }
          
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  })
  .listen(3000);

console.log(`🦊 Intercom Server running at ${app.server?.hostname}:${app.server?.port}`);