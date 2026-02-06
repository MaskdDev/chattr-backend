import type { Response } from "express";

/**
 * Return a response for a room not being found.
 * @param res The response to modify and return.
 */
export function roomNotFound(res: Response): Response {
  return res
    .status(404)
    .json({ code: 404, message: "Room with given ID not found." });
}

/**
 * Return a response for an invite not being found.
 * @param res The response to modify and return.
 */
export function inviteNotFound(res: Response): Response {
  return res
    .status(404)
    .json({ code: 404, message: "Invite with given code not found." });
}
