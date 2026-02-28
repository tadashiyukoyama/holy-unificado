import bcrypt from "bcryptjs";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@local";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(schema.users).values({ email, passwordHash, role: "admin" });
}
