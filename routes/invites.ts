import { Router } from "express";
import { requireAuth } from "../utils/middleware.ts";
import { getInvite } from "../queries/invites.ts";
import { inviteNotFound } from "../utils/responses.ts";

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

// Export router as default export.
export default router;
