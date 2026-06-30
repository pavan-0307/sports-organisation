import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  role: UserRole;
  jti?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-change-in-production';

/**
 * Signs a 15-minute access token containing user identity and access role.
 */
export function generateAccessToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    sub: userId,
    role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Signs a 7-day refresh token containing session jti lookup key.
 */
export function generateRefreshToken(userId: string, role: UserRole, jti: string): string {
  const payload: TokenPayload = {
    sub: userId,
    role,
    jti,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies JWT signature and returns the decoded access token payload.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Verifies JWT signature and returns the decoded refresh token payload.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
