import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { db, getPool } from "./index";

export async function runMigrationsIfEnabled() {
  if (process.env.RUN_MIGRATIONS !== "true") return;

  const migrationsFolder = path.resolve(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  // keep pool alive; App Service may reuse.
}

export async function closeDb() {
  try {
    await getPool().end();
  } catch {
    // ignore
  }
}
