import type { UserProfile } from "../utils/types.ts";
import { database } from "../utils/database.ts";

/**
 * Get a user's profile, given their ID.
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  // Create query
  const query = `
    select "id", "username", "displayUsername" as "displayName", "image" as "avatarUrl" 
    from "users" 
    where id = $1
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
