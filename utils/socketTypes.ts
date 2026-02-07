import type { Message } from "./types.ts";

/**
 * A type representing a websocket message.
 */
export type SocketMessage =
  | MessageSocketMessage
  | PingSocketMessage
  | PongSocketMessage
  | roomSubscribeSocketMessage
  | roomUnsubscribeSocketMessage;

/**
 * A type representing a websocket message, indicating a new message has been sent.
 */
export type MessageSocketMessage = {
  type: "message";
  body: Message;
};

/**
 * A type representing a PING websocket message.
 */
export type PingSocketMessage = {
  type: "ping";
};

/**
 * A type representing a PONG websocket message.
 */
export type PongSocketMessage = {
  type: "pong";
};

/**
 * A type representing a client requesting to subscribe to a given room.
 */
export type roomSubscribeSocketMessage = {
  type: "subscribe";
  roomId: string;
};

/**
 * A type representing a client requesting to unsubscribe from a given room.
 */
export type roomUnsubscribeSocketMessage = {
  type: "unsubscribe";
  roomId: string;
};
