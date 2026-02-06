import { Router } from "express";
import { requireAuth } from "../utils/middleware.ts";
import { getInvite } from "../queries/invites.ts";
import { inviteNotFound } from "../utils/responses.ts";
import invites from "./invites.ts";
import { addMember, isMember } from "../queries/members.ts";

// Create router for route group
const router = Router();

/**
 * Get information for a specified invite.
 */
router.get("/:inviteCode", async (req, res) => {
  // Get invite code from params
  const inviteCode = req.params.inviteCode;

  // Get invite
  const invite = await getInvite(inviteCode);

  // Check if invite exists
  if (invite) {
    res.status(200).json(invite);
  } else {
    return inviteNotFound(res);
  }
});

// Use auth middleware
router.use(requireAuth);

/**
 * Accept an invite with a given code
 */
router.post("/:inviteCode", async (req, res) => {
  // Get user from request
  const user = req.authUser;

  // Check if user is authenticated
  if (user) {
    // Get invite code
    const inviteCode = req.params.inviteCode;

    // Get invite
    const invite = await getInvite(inviteCode);

    // Check if invite exists
    if (!invite) {
      return inviteNotFound(res);
    }

    // Get room ID
    const roomId = BigInt(invite.room.id);

    // Check if user is in room
    if (await isMember(user.id, roomId)) {
      return res
        .status(409)
        .json({ code: 409, message: "User is already in room." });
    }

    // Check if invite has expired
    if (invite.expires && invite.expires <= new Date()) {
      return res
        .status(409)
        .json({ code: 409, message: "Invite has expired." });
    }

    // Check if invite has been used up
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res
        .status(409)
        .json({ code: 409, message: "Invite has been used up." });
    }

    // Add user to room
    const result = await addMember(user.id, roomId);

    // Check if user was added to room
    if (result) {
      res.status(204);
    } else {
      res.sendStatus(500);
    }
  }
});

// Export router as default export.
export default router;
