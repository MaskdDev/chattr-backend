import { auth } from "./auth.ts";
import type { Request, Response, NextFunction } from "express";

/**
 * Middleware that requires the user to be authenticated with BetterAuth.
 * Adds authSession and authUser to request.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Get the current session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Check if the session has an authenticated user
  if (!session?.user) {
    return res.sendStatus(401);
  }

  // Add session and user to request for use by handlers
  req.authSession = session;
  req.authUser = session.user;

  // Call next function in stack
  next();
}

/**
 * Middleware that requires the user to be authenticated with BetterAuth.
 * Adds authSession and authUser to request.
 *
 * Also allows for the internal API key to be passed via the authorisation header.
 */
export async function requireAuthOrKey(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Check if authorisation header is provided
  if (
    req.headers.authorization &&
    req.headers.authorization === `Bearer ${process.env.INTERNAL_API_KEY}`
  ) {
    // Call next function in stack
    return next();
  }

  // Get the current session
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // Check if the session has an authenticated user
  if (!session?.user) {
    return res.sendStatus(401);
  }

  // Add session and user to request for use by handlers
  req.authSession = session;
  req.authUser = session.user;

  // Call next function in stack
  next();
}
