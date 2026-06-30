import argon2 from 'argon2';

/**
 * Hashes a plain-text password using the secure Argon2id algorithm with OWASP recommended parameters.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4,    // 4 threads
  });
}

/**
 * Validates a plain-text password against a stored Argon2id hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}
