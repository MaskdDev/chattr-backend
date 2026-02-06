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
 * A type representing a row in the rooms database table, without record keeping fields.
 */
export type RoomRow = {
  room_id: string;
  creator_id: string;
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
  room: Room;
  creator: UserProfile;
  uses: number;
  max_uses: number;
  expiry: Date;
};

/**
 * A type representing the body of a create invite request.
 */
export type InviteCreate = {
  max_uses: number;
  expiry: Date;
};

/**
 * A type representing a message sent in a room.
 */
export type Message = {
  id: string;
  author: UserProfile;
  content: string;
  timestamp: string;
  editedTimestamp: string | null;
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
  content?: string;
};
