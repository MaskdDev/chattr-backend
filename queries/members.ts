import type { UserProfile } from "../utils/types.ts";
import { roomExists } from "./rooms.ts";
import { database } from "../utils/database.ts";

/**
 * Get the members in a specific room.
 *
 * Assumes the room exists, and returns an empty array even if it doesn't.
 */
export async function getMembers(roomId: bigint): Promise<UserProfile[]> {
  // Create query
  const query = `
    select
        "users"."id" as "id", "users"."username", "users"."displayUsername" as "displayName", "users"."image" as "avatarUrl"
    from "room_members"
    join "users"
        on "users".id = "room_members".member_id
    where "room_members".room_id = $1
  `;
  const values = [roomId];

  // Run query
  const results = await database.query(query, values);

  // Return results
  return results.rows as UserProfile[];
}

/**
 * Add a member with a given ID to a room. Returns whether user was added.
 *
 * Returns null if the room doesn't exist.
 */
export async function addMember(
  memberId: string,
  roomId: bigint,
): Promise<boolean | null> {
  // Check if room exists
  if (await roomExists(roomId)) {
    // Create query
    const query = `
    insert into "room_members" (member_id, room_id) 
    values ($1, $2)
  `;
    const values = [memberId, roomId];

    // Run query
    const results = await database.query(query, values);

    // Check if user was added
    return results.rowCount === 1;
  } else {
    return null;
  }
}

/**
 * Remove a member with a given ID from a specific room. Returns whether user was removed.
 *
 * Returns null if the room doesn't exist.
 */
export async function removeMember(
  memberId: string,
  roomId: bigint,
): Promise<boolean | null> {
  // Check if room exists
  if (await roomExists(roomId)) {
    // Create query
    const query = `
    delete from "room_members"
    where "room_members".member_id = $1 and "room_members".room_id = $2
  `;
    const values = [memberId, roomId];

    // Run query
    const results = await database.query(query, values);

    // Check if user was removed
    return results.rowCount === 1;
  } else {
    return null;
  }
}
