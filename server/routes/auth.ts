import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { signToken } from "../auth/jwt";
import { authMiddleware, type AuthedRequest } from "../auth/middleware";

export function authRouter(jwtSecret: string) {
  const r = Router();

  r.post("/login", async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .safeParse(req.body);

    if (!body.success) return res.status(400).json({ error: "invalid_body", issues: body.error.issues });

    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, body.data.email))
      .limit(1);

    if (!user.length) return res.status(401).json({ error: "bad_credentials" });

    const ok = await bcrypt.compare(body.data.password, user[0].passwordHash);
    if (!ok) return res.status(401).json({ error: "bad_credentials" });

    const token = signToken({ sub: user[0].id, email: user[0].email, role: user[0].role }, jwtSecret);
    return res.json({ token, user: { id: user[0].id, email: user[0].email, role: user[0].role } });
  });

  r.get("/me", authMiddleware(jwtSecret), async (req: AuthedRequest, res) => {
    return res.json({ user: req.user });
  });

  return r;
}
