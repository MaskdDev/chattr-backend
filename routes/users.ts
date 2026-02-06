import { Router } from "express";
import { getUser } from "../queries/users.ts";

// Create router for route group
const router = Router();

/**
 * Fetch a user using their ID.
 */
router.get("/:userId", async (req, res) => {
  // Get user ID from path
  const userId = req.params.userId;

  // Get user
  const user = await getUser(userId);

  // Check if user exists
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({
      code: 404,
      message: "No user found with provided ID.",
    });
  }
});

// Export router as default export.
export default router;
