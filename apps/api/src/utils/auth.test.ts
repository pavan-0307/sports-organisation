import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './hash.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from './token.js';
import { UserRole } from '@prisma/client';

describe('Argon2id Hashing Utility', () => {
  it('should hash and compare passwords correctly', async () => {
    const rawPassword = 'SuperSecureSecretPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isMismatch = await comparePassword('wrongPassword', hash);
    expect(isMismatch).toBe(false);
  });
});

describe('JWT Access & Refresh Token Utility', () => {
  it('should generate and verify access tokens', () => {
    const userId = '019067b5-24e5-79a4-a3cd-b956241a293b';
    const role = UserRole.customer;

    const token = generateAccessToken(userId, role);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toEqual(userId);
    expect(decoded.role).toEqual(role);
  });

  it('should generate and verify refresh tokens with JTI session keys', () => {
    const userId = '019067b5-24e5-79a4-a3cd-b956241a293b';
    const role = UserRole.staff;
    const jti = 'jti-session-verification-key';

    const token = generateRefreshToken(userId, role, jti);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toEqual(userId);
    expect(decoded.role).toEqual(role);
    expect(decoded.jti).toEqual(jti);
  });
});
