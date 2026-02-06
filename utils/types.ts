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
