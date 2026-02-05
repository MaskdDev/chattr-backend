import { Pool } from "pg";
import type { UserProfile } from "./types.ts";

// Create database pool
export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get a user's profile, given their ID.
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  // Create query
  const query = `SELECT "id", "username", "displayUsername" AS "displayName", "image" AS "avatarUrl" FROM "user" WHERE id=$1`;
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
