import type { Invite } from "../utils/types.ts";
import { database } from "../utils/database.ts";

/**
 * Get an invite with a given code.
 */
export async function getInvite(inviteCode: string): Promise<Invite | null> {
  // Create query
  const query = `
    select 
      "invites"."invite_code" as "code", "invites"."uses", "invites".max_uses, "invites"."expires" as "expiry",
      jsonb_build_object(
      'id', "rooms".room_id,
      'creatorId', "rooms"."creator_id",
      'name', "rooms"."name",
      'description', "rooms"."description"
                        ) filter ( where "rooms".room_id is not null ) as "room",
      jsonb_build_object(
      'id', "users".id,
      'username', "users"."username",
      'displayName', "users"."displayUsername",
      'avatarUrl', "users"."image"
                        ) filter ( where "users".id is not null ) as "creator"
    from "room_invites" as "invites"
    left join "users"
        on "users".id = "invites".creator_id
    left join "rooms"
        on "rooms"."room_id" = "invites"."room_id"
    where "invites"."invite_code" = $1
  `;
  const values = [inviteCode];

  // Run query
  const results = await database.query(query, values);

  // Check if invite was found
  if (results.rows.length === 1) {
    return results.rows[0] as Invite;
  } else {
    return null;
  }
}

/**
 * Get all invites for a room with a given ID.
 *
 * Returns null if room not found.
 */
export async function getRoomInvites(roomId: bigint): Promise<Invite[] | null> {
  // Create query
  const query = `
    select 
      "invites"."invite_code" as "code", "invites"."uses", "invites".max_uses, "invites"."expires" as "expiry",
      jsonb_build_object(
      'id', "rooms".room_id,
      'creatorId', "rooms"."creator_id",
      'name', "rooms"."name",
      'description', "rooms"."description"
                        ) filter ( where "rooms".room_id is not null ) as "room",
      jsonb_build_object(
      'id', "users".id,
      'username', "users"."username",
      'displayName', "users"."displayUsername",
      'avatarUrl', "users"."image"
                        ) filter ( where "users".id is not null ) as "creator"
    from "room_invites" as "invites"
    left join "users"
        on "users".id = "invites".creator_id
    left join "rooms"
        on "rooms"."room_id" = "invites"."room_id"
    where "rooms"."room_id" = $1
  `;
  const values = [roomId];

  // Run query
  const results = await database.query(query, values);

  // Return invites
  return results.rows as Invite[];
}
