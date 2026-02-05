import { Pool } from "pg";
import type { Room, UserProfile } from "./types.ts";

// Create database pool
export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get a user's profile, given their ID.
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  // Create query
  const query = `
    SELECT "id", "username", "displayUsername" AS "displayName", "image" AS "avatarUrl" 
    FROM "users" 
    WHERE id = $1
  `;
  const values = [userId];

  // Run query
  const results = await database.query(query, values);

  // Check if user was found
  if (results.rows.length === 1) {
    return results.rows[0] as UserProfile;
  } else {
    return null;
  }
}

/**
 * Get all public rooms a given user is not in.
 */
export async function getUnjoinedPublicRooms(userId: string): Promise<Room[]> {
  // Create query
  const query = `
    select "room_id" as "id", "name", "description", "visibility"
    from "rooms" 
    where "visibility" = 'public' and not exists (
      select 1
      from "room_members" as "members"
      where "member_id" = $1 and "members"."room_id" = "rooms".room_id
    )
  `;

  // Run query
  const results = await database.query(query);

  // Return query result
  return results.rows as Room[];
}

/**
 * Get all rooms the user with the given ID is in.
 */
export async function getUserRooms(userId: string): Promise<Room[]> {
  // Create query
  const query = `
    select "rooms"."room_id" as "id", "rooms"."name", "rooms"."description", "rooms"."visibility"
    from "room_members"
    join "rooms"
    on "rooms".room_id = "room_members".room_id
    where "room_members".member_id = $1
  `;
  const values = [userId];

  // Run query
  const results = await database.query(query, values);

  // Return query result
  return results.rows as Room[];
}
