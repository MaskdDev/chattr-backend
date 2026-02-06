import { Pool } from "pg";
import type { Room, RoomRow, UserProfile } from "./types.ts";
import generator from "./snowflake.ts";

// Create database pool
export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});
