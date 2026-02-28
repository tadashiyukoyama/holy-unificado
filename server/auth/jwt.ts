import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export function signToken(payload: AuthTokenPayload, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string, secret: string): AuthTokenPayload {
  return jwt.verify(token, secret) as AuthTokenPayload;
}
