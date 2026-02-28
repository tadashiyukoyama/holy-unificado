import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const ssl =
    process.env.PG_SSL === "true" || process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined;

  return new Pool({
    connectionString: url,
    ssl,
    max: Number(process.env.PG_POOL_MAX || 10),
  });
}

let pool: pg.Pool | null = null;

export function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

export const db = drizzle(getPool(), { schema });

export type Db = typeof db;
export { schema };
