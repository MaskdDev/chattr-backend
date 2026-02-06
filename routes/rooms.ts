import { Router } from "express";
import { requireAuth } from "../utils/middleware.ts";
import {
  createRoom,
  deleteRoom,
  getRoom,
  getUserRooms,
  updateRoom,
} from "../queries/rooms.ts";
import type { RoomCreate, RoomPatch } from "../utils/types.ts";
import { getMembers, removeMember } from "../queries/members.ts";
import { roomNotFound } from "../utils/responses.ts";

// Create router for route group
const router = Router();

// Use auth middleware
router.use(requireAuth);

/**
 * Get a summary of all rooms available to the currently logged-in user.
 */
router.get("/", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get all rooms for user
    const rooms = await getUserRooms(user.id);

    // Return success
    res.status(200).json({ rooms });
  }
});

/**
 * Create a new room.
 */
router.post("/", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get request body
    const body = req.body as RoomCreate;

    // If description not provided, default to no description
    if (body.description === undefined) {
      body.description = null;
    }

    // Check for length issues
    if (body.name.length > 20 || body.name.length < 3) {
      return res.status(422).json({
        code: 422,
        message: "Room name must be between 3 and 20 characters.",
      });
    }

    if (body.description && body.description.length > 150) {
      return res.status(422).json({
        code: 422,
        message: "Room description cannot exceed 150 characters.",
      });
    }

    // Create room
    const room = await createRoom(user.id, body.name, body.description);

    // Return success
    res.status(201).json(room);
  }
});

/**
 * Get information on a specific room
 */
router.get("/:roomId", async (req, res) => {
  // Get room ID
  const roomId = BigInt(req.params.roomId);

  // Get room
  const room = await getRoom(roomId);

  // Check if room exists
  if (room) {
    res.status(200).json(room);
  } else {
    res
      .status(404)
      .json({ code: 404, message: "Room with given ID not found." });
  }
});

/**
 * Update an existing room.
 */
router.patch("/:roomId", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room ID
    const roomId = BigInt(req.params.roomId);

    // Get room
    const room = await getRoom(roomId);

    // Check if room exists
    if (!room) {
      return roomNotFound(res);
    }

    // Check if room belongs to user
    if (room.creator?.id !== user.id) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to edit this room.",
      });
    }

    // Get body
    const body: RoomPatch = req.body;

    // Check for length issues
    if (body.name && (body.name.length > 20 || body.name.length < 3)) {
      return res.status(422).json({
        code: 422,
        message: "Room name must be between 3 and 20 characters.",
      });
    }

    if (body.description && body.description.length > 150) {
      return res.status(422).json({
        code: 422,
        message: "Room description cannot exceed 150 characters.",
      });
    }

    // Edit room
    await updateRoom(roomId, body.name, body.description);

    // Return success
    res.status(204);
  }
});

/**
 * Delete an existing room.
 */
router.delete("/:roomId", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room ID
    const roomId = BigInt(req.params.roomId);

    // Get room
    const room = await getRoom(roomId);

    // Check if room exists
    if (!room) {
      return roomNotFound(res);
    }

    // Check if room belongs to user
    if (room.creator?.id !== user.id) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to delete this room.",
      });
    }

    // Delete room
    await deleteRoom(roomId);

    // Return success
    res.status(204);
  }
});

/**
 * Get the members of a specific room.
 */
router.get("/:roomId/members", async (req, res) => {
  // Get room ID
  const roomId = BigInt(req.params.roomId);

  // Get room members
  const members = await getMembers(roomId);

  // Check if room exists
  if (!members) {
    return roomNotFound(res);
  }

  // Return room members
  res.status(200).json({ members });
});

/**
 * Remove a members from a specific room.
 */
router.delete("/:roomId/members/:memberId", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get room ID and member ID
    const roomId = BigInt(req.params.roomId);
    const memberId = req.params.memberId;

    // Get room
    const room = await getRoom(roomId);

    // Check if room exists
    if (!room) {
      return roomNotFound(res);
    }

    // Check if user can remove member from room
    if (!(memberId === user.id || room.creator?.id === user.id)) {
      return res.status(403).json({
        code: 403,
        message: "User does not have the permission to remove this member.",
      });
    }

    // Remove member
    const result = await removeMember(memberId, roomId);

    // Check if member was removed
    if (result) {
      res.status(204);
    } else {
      res
        .status(404)
        .json({ code: 404, message: "Member with given ID not found." });
    }
  }
});

// Export router as default export.
export default router;
