import type { Message } from "../utils/types.ts";
import { database } from "../utils/database.ts";

/**
 * Get a specified number of messages from a given room, before/after a specified message ID (not inclusive).
 *
 * If neither beforeMessageId nor afterMessageId are provided, this just returns the latest 25 messages.
 *
 * Newest message first.
 */
export async function getMessages(
  roomId: bigint,
  messageLimit: number,
  beforeMessageId: bigint | null = null,
  afterMessageId: bigint | null = null,
): Promise<Message[]> {
  // Initialise values
  const values: (bigint | number)[] = [roomId];
  let nextPlaceholder = 2;

  // Create message filters, if required.
  let messageFilter = " and ";
  if (beforeMessageId) {
    messageFilter += ` and "message_id" < $${nextPlaceholder++}`;
    values.push(beforeMessageId);
  }
  if (afterMessageId) {
    messageFilter += ` and "message_id" > $${nextPlaceholder++}`;
    values.push(afterMessageId);
  }

  // Add limit to query values
  values.push(messageLimit);

  // Create query
  const query = `
    select "message_id" as "id", "content", "timestamp", "edit_timestamp" as "editedTimestamp",
        jsonb_build_object(
        'id', "users".id,
        'username', "users"."username",
        'displayName', "users"."displayUsername",
        'avatarUrl', "users"."image"
        ) filter ( where "users".id is not null ) as "author"
    from "messages"
    left join "users"
        on "users"."id" = "messages"."author_id"
    where "room_id" = $1 ${messageFilter}
    order by "message_id" desc
    limit $${nextPlaceholder++}`;

  // Run query
  const results = await database.query(query, values);

  // Return messages
  return results.rows as Message[];
}

/**
 * Get a message with a specified ID.
 *
 * Returns null if message doesn't exist.
 */
export async function getMessage(messageId: bigint): Promise<Message | null> {
  // Create query
  const query = `
    select "message_id" as "id", "content", "timestamp", "edit_timestamp" as "editedTimestamp",
        jsonb_build_object(
        'id', "users".id,
        'username', "users"."username",
        'displayName', "users"."displayUsername",
        'avatarUrl', "users"."image"
        ) filter ( where "users".id is not null ) as "author"
    from "messages"
    left join "users"
        on "users"."id" = "messages"."author_id"
    where "message_id" = $1
    `;

  // Run query
  const results = await database.query(query, [messageId]);

  // Check if message exists
  if (results.rows.length === 1) {
    return results.rows[0] as Message;
  } else {
    return null;
  }
}
