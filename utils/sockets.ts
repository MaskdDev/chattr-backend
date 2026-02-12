import { WebSocket, WebSocketServer } from "ws";
import type { IncomingMessage } from "http";
import type { Stream } from "stream";
import type { SocketMessage } from "./socketTypes.ts";
import { stringArrayToBigInt } from "./parsing.ts";
import type { Message } from "./types.ts";

// Websockets state
const sockets: Map<WebSocket, bigint[]> = new Map();
const subscriptions: Map<bigint, WebSocket[]> = new Map();

// Subscribers map functions

/**
 * Add a new subscriber to a room with a given ID.
 */
function addSubscriber(roomId: bigint, socket: WebSocket) {
  // Check if room is in subscriptions map
  if (subscriptions.has(roomId)) {
    subscriptions.get(roomId)?.push(socket);
  } else {
    subscriptions.set(roomId, [socket]);
  }
}

/**
 * Remove a subscriber from a room with a given ID.
 */
function removeSubscriber(roomId: bigint, socket: WebSocket) {
  // Check if room is in subscriptions map
  if (subscriptions.has(roomId)) {
    // Get subscriber array
    const subscribers = subscriptions.get(roomId) as WebSocket[];

    // Get socket index
    const socketIndex = subscribers.indexOf(socket);

    // If socket exists, remove it from array.
    if (socketIndex >= 0) {
      subscribers.splice(socketIndex, 1);
    }
  }
}

/**
 * Send a websocket string message to all subscribers of a given room.
 */
export function broadcastToSubscribers(roomId: bigint, message: Message) {
  // Check if room is in subscriptions map
  if (subscriptions.has(roomId)) {
    // Get subscriber array
    const subscribers = subscriptions.get(roomId) as WebSocket[];

    // Broadcast message to all subscribers
    subscribers.forEach((socket) =>
      socket.send(
        JSON.stringify({
          type: "message",
          roomId: roomId.toString(),
          body: message,
        }),
      ),
    );
  }
}

// Websocket state functions

/**
 * Add a websocket to the websockets map.
 */
function registerWebSocket(socket: WebSocket) {
  // Add socket to map.
  sockets.set(socket, []);
}

/**
 * Remove a websocket from the websockets map and cancel all of its subscriptions.
 */
function deregisterWebSocket(socket: WebSocket) {
  // Get socket subscriptions
  const socketSubscriptions = sockets.get(socket) ?? [];

  // Remove all subscriptions for socket
  socketSubscriptions.forEach((roomId) => removeSubscriber(roomId, socket));

  // Remove socket from map
  sockets.delete(socket);
}

/**
 * Handle an incoming websocket message.
 */
function handleWebSocketMessage(socket: WebSocket, data: WebSocket.RawData) {
  try {
    // Parse message JSON
    const message: SocketMessage = JSON.parse(data.toString());

    // Check message type
    switch (message.type) {
      case "ping": {
        socket.send(JSON.stringify({ type: "pong" }));
        break;
      }

      case "subscribe": {
        // Check if one or multiple room IDs were provided
        if (message.roomId) {
          // Get room ID
          const roomId = BigInt(message.roomId);

          // Subscribe websocket to room
          addSubscriber(roomId, socket);
          break;
        } else if (message.roomIds) {
          // Get all valid room IDs
          const roomIds = stringArrayToBigInt(message.roomIds);

          // Subscribe websocket to all specified rooms.
          roomIds.forEach((roomId) => {
            addSubscriber(roomId, socket);
          });
        }
        break;
      }

      case "unsubscribe": {
        // Check if one or multiple room IDs were provided
        if (message.roomId) {
          // Get room ID
          const roomId = BigInt(message.roomId);

          // Unsubscribe websocket from room
          removeSubscriber(roomId, socket);
          break;
        } else if (message.roomIds) {
          // Get all valid room IDs
          const roomIds = stringArrayToBigInt(message.roomIds);

          // Unsubscribe websocket from all specified rooms.
          roomIds.forEach((roomId) => {
            removeSubscriber(roomId, socket);
          });
        }
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Websocket error: ${error.name}: ${error.message}`);
    } else {
      console.error(`Websocket error: ${error}`);
    }
  }
}

/**
 * Create a websocket server with the required event handlers and no configured
 * underlying HTTP server.
 */
export function createWebSocketServer(): WebSocketServer {
  // Create server
  const wss = new WebSocketServer({ noServer: true });

  // Set up server event handlers
  wss.on("connection", (ws) => {
    // Register websocket
    registerWebSocket(ws);

    // Add websocket close handler
    ws.on("close", () => deregisterWebSocket(ws));

    // Add websocket message handler
    ws.on("message", (message) => handleWebSocketMessage(ws, message));
  });

  // Return server
  return wss;
}

/**
 * Return the upgrade callback for the HTTP server, given the websocket server to use.
 */
export function serverUpgradeCallback(
  webSocketServer: WebSocketServer,
): (
  request: IncomingMessage,
  socket: Stream.Duplex,
  head: Buffer<ArrayBuffer>,
) => void {
  return (request, socket, head) => {
    // Check if request has a URL
    if (!request.url) {
      // Destroy socket and return
      socket.destroy();
      return;
    }

    // Get path name
    const { pathname } = new URL(request.url, process.env.BASE_WEBSOCKET_URL);

    // Check if path is /gateway
    if (pathname === "/gateway") {
      webSocketServer.handleUpgrade(request, socket, head, (ws) =>
        webSocketServer.emit("connection", ws, request),
      );
    } else {
      // Destroy socket
      socket.destroy();
    }
  };
}
