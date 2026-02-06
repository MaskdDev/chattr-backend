import type { Invite, InviteRow, PartialInvite } from "../utils/types.ts";
import { database } from "../utils/database.ts";
import { generateInviteCode } from "../utils/generation.ts";
import { getUser } from "./users.ts";

/**
 * Get an invite with a given code.
 */
export async function getInvite(inviteCode: string): Promise<Invite | null> {
  // Create query
  const query = `
    select 
      "invites"."invite_code" as "code", "invites"."uses", "invites".max_uses as "maxUses", "invites"."expires",
      case when "rooms".room_id is not null
        then
          jsonb_build_object(
          'id', "rooms".room_id,
          'creatorId', "rooms"."creator_id",
          'name', "rooms"."name",
          'description', "rooms"."description"
                            ) 
        else null
        end as "room",
      case when "users".id is not null
        then
          jsonb_build_object(
          'id', "users".id,
          'username', "users"."username",
          'displayName', "users"."displayUsername",
          'avatarUrl', "users"."image"
                            ) 
        else null
      end as "creator"
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
 * Increment the number of uses for an invite with a given code.
 *
 * Assumes the room existed, does not throw an error if no rows were updated.
 */
export async function incrementInviteUses(inviteCode: string): Promise<void> {
  // Create query
  const query = `
    update "room_invites"
    set "uses" = "uses" + 1
    where "invite_code" = $1
  `;
  const values = [inviteCode];

  // Run query
  await database.query(query, values);
}

/**
 * Create a new invite as a specified user for a specific room, with a specified max uses and expiry date.
 *
 * Throws an error on a fail.
 */
export async function createInvite(
  creatorId: string,
  roomId: bigint,
  maxUses: number | null,
  expires: Date | null,
): Promise<PartialInvite> {
  // Generate invite code
  const inviteCode = generateInviteCode();

  // Create query
  const query = `
    insert into "room_invites" ("invite_code", "room_id", "creator_id", "max_uses", "expires") 
    values ($1, $2, $3, $4, $5)
    returning *
  `;
  const values = [inviteCode, roomId, creatorId, maxUses, expires];

  // Run query
  const results = await database.query(query, values);

  // Return query result
  if (results.rows.length === 1) {
    // Get row
    const inviteRow: InviteRow = results.rows[0];

    // Return partial invite
    return {
      code: inviteRow.invite_code,
      roomId: inviteRow.room_id,
      creatorId: inviteRow.creator_id,
      uses: inviteRow.uses,
      maxUses: inviteRow.max_uses,
      expires: inviteRow.expires,
    };
  } else {
    throw new Error("Could not create invite.");
  }
}

/**
 * Delete an invite with a given code. Returns whether a deletion was performed.
 */
export async function deleteInvite(inviteCode: string): Promise<boolean> {
  // Create query
  const query = `
    delete from "room_invites" as "invites"
    where "invites"."invite_code" = $1
  `;
  const values = [inviteCode];

  // Run query
  const results = await database.query(query, values);

  // Return if anything was deleted
  return !!results.rowCount;
}

/**
 * Get all invites for a room with a given ID.
 *
 * Assumes room exists.
 */
export async function getRoomInvites(roomId: bigint): Promise<Invite[]> {
  // Create query
  const query = `
    select 
      "invites"."invite_code" as "code", "invites"."uses", "invites"."max_uses" as "maxUses", "invites"."expires",
      case when "rooms"."room_id" is not null
        then
          jsonb_build_object(
          'id', "rooms".room_id,
          'creatorId', "rooms"."creator_id",
          'name', "rooms"."name",
          'description', "rooms"."description"
                            )
        else null
      end as "room",
      case when "users"."id" is not null
        then
          jsonb_build_object(
          'id', "users".id,
          'username', "users"."username",
          'displayName', "users"."displayUsername",
          'avatarUrl', "users"."image"
                            )
        else null
      end as "creator"
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
