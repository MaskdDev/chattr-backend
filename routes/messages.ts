import { Router } from "express";
import { requireAuth } from "../utils/middleware.ts";
import type { Request } from "express";
import { isMember } from "../queries/members.ts";
import { getRoom, roomExists } from "../queries/rooms.ts";
import { messageNotFound, roomNotFound } from "../utils/responses.ts";
import {
  createMessage,
  deleteMessage,
  editMessage,
  getMessage,
  getMessages,
} from "../queries/messages.ts";
import type { MessageCreate, MessagePatch } from "../utils/types.ts";
import { broadcastToSubscribers } from "../utils/sockets.ts";

// Create router for route group
const router = Router({ mergeParams: true });
type MergedRequest = Request<{ roomId: string }>;
type MergedRequestWithMessage = Request<{ roomId: string; messageId: string }>;

// Use auth middleware
router.use(requireAuth);

/**
 * Get the messages in a given room.
 */
router.get("/", async (req: MergedRequest, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room ID
    const roomId = BigInt(req.params.roomId);

    // Check if room exists
    if (!(await roomExists(roomId))) {
      return roomNotFound(res);
    }

    // Check if user is in room.
    const inRoom = await isMember(user.id, roomId);
    if (!inRoom) {
      return res.status(403).json({
        code: 403,
        message:
          "User does not have the permission to view messages in this channel.",
      });
    }

    // Get query params
    let messageLimit: number | null = 25;
    if (req.query.limit && typeof req.query.limit === "string") {
      messageLimit = Number(req.query.limit);
    }
    let afterMessageId: bigint | null = null;
    if (req.query.after && typeof req.query.after === "string") {
      afterMessageId = BigInt(req.query.after);
    }
    let beforeMessageId: bigint | null = null;
    if (req.query.before && typeof req.query.before === "string") {
      beforeMessageId = BigInt(req.query.before);
    }

    // Get messages
    const messages = await getMessages(
      roomId,
      messageLimit,
      beforeMessageId,
      afterMessageId,
    );

    // Return messages
    res.status(200).json({ messages });
  }
});

/**
 * Send a new message in a given room.
 */
router.post("/", async (req: MergedRequest, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room ID
    const roomId = BigInt(req.params.roomId);

    // Check if room exists
    if (!(await roomExists(roomId))) {
      return roomNotFound(res);
    }

    // Check if user is in room.
    const inRoom = await isMember(user.id, roomId);
    if (!inRoom) {
      return res.status(403).json({
        code: 403,
        message:
          "User does not have the permission to send messages in this channel.",
      });
    }

    // Get request body
    const body: MessageCreate = req.body;

    // Check message length
    if (!body.content || body.content.length > 1000) {
      return res.status(422).json({
        code: 422,
        message: "Message content must be between 1 and 1000 characters long.",
      });
    }

    // Send message
    const message = await createMessage(roomId, user.id, body.content);

    // Send message to all subscribers
    setTimeout(() => broadcastToSubscribers(roomId, message), 0);

    // Return message
    res.status(200).json(message);
  }
});

/**
 * Fetch a message from a room.
 */
router.get("/:messageId", async (req: MergedRequestWithMessage, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room and message ID
    const roomId = BigInt(req.params.roomId);
    const messageId = BigInt(req.params.messageId);

    // Check if room exists
    if (!(await roomExists(roomId))) {
      return roomNotFound(res);
    }

    // Check if user is in room.
    const inRoom = await isMember(user.id, roomId);
    if (!inRoom) {
      return res.status(403).json({
        code: 403,
        message:
          "User does not have the permission to view messages in this channel.",
      });
    }

    // Get message
    const message = await getMessage(messageId);

    // Check if message exists
    if (message) {
      res.status(200).json(message);
    } else {
      return messageNotFound(res);
    }
  }
});

/**
 * Edit a message in a room.
 */
router.patch("/:messageId", async (req: MergedRequestWithMessage, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room and message ID
    const roomId = BigInt(req.params.roomId);
    const messageId = BigInt(req.params.messageId);

    // Check if room exists
    if (!(await roomExists(roomId))) {
      return roomNotFound(res);
    }

    // Check if user is in room.
    const inRoom = await isMember(user.id, roomId);
    if (!inRoom) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to edit this message.",
      });
    }

    // Get message.
    const message = await getMessage(messageId);

    // Check if message exists.
    if (!message) {
      return messageNotFound(res);
    }

    // Check if user owns message.
    if (message.author?.id !== user.id) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to edit this message.",
      });
    }

    // Get request body
    const body: MessagePatch = req.body;

    // Check message length
    if (!body.content || body.content.length > 1000) {
      return res.status(422).json({
        code: 422,
        message: "Message content must be between 1 and 1000 characters long.",
      });
    }

    // Edit message
    await editMessage(messageId, body.content);

    // Return success.
    res.sendStatus(204);
  }
});

/**
 * Delete a message in a room.
 */
router.delete("/:messageId", async (req: MergedRequestWithMessage, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room and message ID
    const roomId = BigInt(req.params.roomId);
    const messageId = BigInt(req.params.messageId);

    // Get room
    const room = await getRoom(roomId);

    // Check if room exists
    if (!room) {
      return roomNotFound(res);
    }

    // Check if user is in room.
    const inRoom = await isMember(user.id, roomId);
    if (!inRoom) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to delete this message.",
      });
    }

    // Get message.
    const message = await getMessage(messageId);

    // Check if message exists.
    if (!message) {
      return messageNotFound(res);
    }

    // Check if user owns message or is room creator.
    if (message.author?.id !== user.id && room.creator?.id !== user.id) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to delete this message.",
      });
    }

    // Delete message
    await deleteMessage(messageId);

    // Return success.
    res.sendStatus(204);
  }
});

// Export router as default export.
export default router;
