import type { Message, MessageRow, UserProfile } from "../utils/types.ts";
import { database } from "../utils/database.ts";
import generator from "../utils/snowflake.ts";
import { getUser } from "./users.ts";

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
    select "message_id" as "id", "room_id", "content", "timestamp", "edit_timestamp" as "editedTimestamp",
      case when "users"."id" is not null
        then
          jsonb_build_object(
          'id', "users".id,
          'username', "users"."username",
          'displayName', "users"."displayUsername",
          'avatarUrl', "users"."image"
          )
        else null
      end as "author"
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
    select "message_id" as "id", "room_id", "content", "timestamp", "edit_timestamp" as "editedTimestamp",
      case when "users"."id" is not null
        then
          jsonb_build_object(
          'id', "users".id,
          'username', "users"."username",
          'displayName', "users"."displayUsername",
          'avatarUrl', "users"."image"
          )
        else null
      end as "author"
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

/**
 * Create a new message in a specified room, as a specified user, with provided content.
 *
 * Throws an error on a fail.
 */
export async function createMessage(
  roomId: bigint,
  authorId: string,
  content: string,
): Promise<Message> {
  // Generate message ID
  const messageId = generator.generate();

  // Create query
  const query = `
    insert into "messages" ("message_id", "room_id", "author_id", "content") 
    values ($1, $2, $3, $4)
    returning ("message_id", "room_id", "author_id", "content", "timestamp", "edit_timestamp")
  `;
  const values = [messageId, roomId, authorId, content];

  // Run query
  const results = await database.query(query, values);

  // Return query result
  if (results.rows.length === 1) {
    // Get row
    const messageRow: MessageRow = results.rows[0];

    // Fetch author
    let author: UserProfile | null = null;
    if (messageRow.author_id) {
      author = await getUser(messageRow.author_id);
    }

    // Return message
    return {
      id: messageRow.message_id,
      roomId: messageRow.room_id,
      author,
      content: messageRow.content,
      timestamp: messageRow.timestamp,
      editedTimestamp: messageRow.edit_timestamp,
    };
  } else {
    throw new Error("Could not create message.");
  }
}

/**
 * Edit the content of a message with a given ID.
 *
 * Return whether an edit was performed.
 */
export async function editMessage(
  messageId: bigint,
  newContent: string,
): Promise<boolean> {
  // Create query
  const query = `
    update "messages"
    set "content" = $1
    where "message_id" = $2`;
  const values = [newContent, messageId];

  // Run query
  const results = await database.query(query, values);

  // Return if anything was edited
  return !!results.rowCount;
}

/**
 * Delete a message with a given ID.
 *
 * Returns whether a deletion was performed.
 */
export async function deleteMessage(messageId: bigint): Promise<boolean> {
  // Create query
  const query = `
    delete from "messages"
    where "message_id" = $1`;
  const values = [messageId];

  // Run query
  const results = await database.query(query, values);

  // Return if anything was deleted
  return !!results.rowCount;
}
