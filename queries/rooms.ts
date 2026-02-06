import { database } from "../utils/database.ts";
import type { PartialRoom, Room, RoomRow } from "../utils/types.ts";
import { generator } from "../utils/snowflake.ts";
import { getUser } from "./users.ts";

/**
 * Get the partial rooms for all rooms the user with the given ID is in.
 */
export async function getUserRooms(userId: string): Promise<PartialRoom[]> {
  // Create query
  const query = `
    select 
        "rooms"."room_id" as "id", "rooms"."creator_id" as "creatorId", "rooms"."name", "rooms"."description"
    from "room_members"
    join "rooms"
        on "rooms".room_id = "room_members".room_id
    where "room_members".member_id = $1
  `;
  const values = [userId];

  // Run query
  const results = await database.query(query, values);

  // Return query result
  return results.rows as PartialRoom[];
}

/**
 * Get a room with a given ID.
 */
export async function getRoom(roomId: bigint): Promise<Room | null> {
  // Create query
  const query = `
    select 
      "rooms"."room_id" as "id", "rooms"."name", "rooms"."description",
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
    from "rooms"
    left join "users"
        on "users".id = "rooms".creator_id
    where "rooms".room_id = $1
  `;
  const values = [roomId];

  // Run query
  const results = await database.query(query, values);

  // Check if room was found
  if (results.rows.length === 1) {
    return results.rows[0] as Room;
  } else {
    return null;
  }
}

/**
 * Return whether a room with a given ID exists.
 */
export async function roomExists(roomId: bigint): Promise<boolean> {
  // Create query
  const query = `
  select exists (
    select 1
    from "rooms"
    where "room_id" = $1
  ) as result
  `;

  // Run query
  const results = await database.query(query, [roomId]);

  // Return result
  if (results.rows.length === 1) {
    return results.rows[0].result;
  } else {
    return false;
  }
}

/**
 * Create a new room as a specified user, with a specified name and optional description.
 *
 * Throws an error on a fail.
 */
export async function createRoom(
  userId: string,
  name: string,
  description: string | null,
): Promise<PartialRoom> {
  // Generate room ID
  const roomId = generator.generate();

  // Create query
  const query = `
    insert into "rooms" ("room_id", "creator_id", "name", "description") 
    values ($1, $2, $3, $4)
    returning *
  `;
  const values = [roomId, userId, name, description];

  // Run query
  const results = await database.query(query, values);

  // Return query result
  if (results.rows.length === 1) {
    // Get row
    const roomRow: RoomRow = results.rows[0];

    // Return room
    return {
      id: roomRow.room_id,
      creatorId: roomRow.creator_id,
      name: roomRow.name,
      description: roomRow.description,
    };
  } else {
    throw new Error("Could not create room.");
  }
}

/**
 * Update an existing room.
 *
 * Returns whether an update was performed.
 */
export async function updateRoom(
  roomId: bigint,
  name: string | undefined,
  description: string | null | undefined,
): Promise<boolean> {
  // Get fields to update
  const fields = [];
  const values = [];
  let nextPlaceholder = 1;

  if (name !== undefined) {
    fields.push(`"name" = $${nextPlaceholder++}`);
    values.push(name);
  }

  if (description !== undefined) {
    fields.push(`"description" = $${nextPlaceholder++}`);
  }

  // Add room ID to values
  values.push(roomId);

  // Create query
  const query = `
    update "rooms"
    set ${fields.join(", ")}
    where "rooms".room_id = $${nextPlaceholder}`;

  // Run query
  const results = await database.query(query, values);

  // Return if anything was updated
  return !!results.rowCount;
}

/**
 * Update an existing room.
 *
 * Returns whether a deletion was performed.
 */
export async function deleteRoom(roomId: bigint): Promise<boolean> {
  // Create query
  const query = `
    delete from "rooms"
    where "rooms".room_id = $1`;

  // Run query
  const results = await database.query(query, [roomId]);

  // Return if anything was deleted
  return !!results.rowCount;
}
