// User types

/**
 * A type representing a user's profile.
 */
export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * A type representing a room.
 */
export type Room = {
  id: string;
  creator: UserProfile | null;
  name: string;
  description: string | null;
};

/**
 * A type representing a partial room, without the full creator object.
 */
export type PartialRoom = {
  id: string;
  creatorId: string | null;
  name: string;
  description: string | null;
};

/**
 * A type representing a row in the rooms database table, without record keeping fields.
 */
export type RoomRow = {
  room_id: string;
  creator_id: string | null;
  name: string;
  description: string | null;
};

/**
 * A type representing the body of a create room request.
 */
export type RoomCreate = {
  name: string;
  description?: string | null;
};

/**
 * A type representing the body of a patch room request.
 */
export type RoomPatch = {
  name?: string;
  description?: string | null;
};

/**
 * A type representing an invite to a room.
 */
export type Invite = {
  code: string;
  room: PartialRoom;
  creator: UserProfile | null;
  uses: number;
  maxUses: number | null;
  expires: Date | null;
};

/**
 * A type representing a partial invite to a room, without the full room or creator objects.
 */
export type PartialInvite = {
  code: string;
  roomId: string;
  creatorId: string | null;
  uses: number;
  maxUses: number | null;
  expires: Date | null;
};

/**
 * A type representing a row in the room_invites database table, without record keeping fields.
 */
export type InviteRow = {
  invite_code: string;
  room_id: string;
  creator_id: string;
  uses: number;
  max_uses: number | null;
  expires: Date | null;
};

/**
 * A type representing the body of a create invite request.
 */
export type InviteCreate = {
  maxUses: number | null;
  expires: Date | null;
};

/**
 * A type representing a message sent in a room.
 */
export type Message = {
  id: string;
  roomId: string;
  author: UserProfile | null;
  content: string;
  timestamp: Date;
  editedTimestamp: Date | null;
};

/**
 * A type representing a row in the messages database table, without record keeping fields.
 */
export type MessageRow = {
  message_id: string;
  room_id: string;
  author_id: string | null;
  content: string;
  timestamp: Date;
  edit_timestamp: Date;
};

/**
 * A type representing the body of a create message request.
 */
export type MessageCreate = {
  content: string;
};

/**
 * A type representing the body of a patch message request.
 */
export type MessagePatch = {
  content: string;
};
