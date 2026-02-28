import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authMiddleware(jwtSecret: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing_token" });
    try {
      const payload = verifyToken(token, jwtSecret);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
      return next();
    } catch {
      return res.status(401).json({ error: "invalid_token" });
    }
  };
}
