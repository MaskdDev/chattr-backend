import { Pool } from "pg";

// Create database pool
export const database = new Pool({
  connectionString: process.env.DATABASE_URL,
});
