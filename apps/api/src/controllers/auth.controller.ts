import { Request, Response } from 'express';
import { PrismaClient, UserRole, UserStatus, VerificationCodeType } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword } from '../utils/hash.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/token.js';

const prisma = new PrismaClient();

// Input Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: z.string().optional()
});

const otpRequestSchema = z.object({
  email: z.string().email('Invalid email address format.')
});

const otpVerifySchema = z.object({
  email: z.string().email('Invalid email address format.'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits.')
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8)
});

/**
 * Endpoint registering new Customer accounts.
 */
export async function register(req: Request, res: Response) {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request body failed data validation.',
          details: parse.error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }))
        }
      });
    }

    const { email, password, firstName, lastName, phone } = parse.data;

    // Check email availability
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'An account with this email address already exists.'
        }
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: UserRole.customer,
        status: UserStatus.inactive // Inactive until email/OTP validation
      }
    });

    // Auto-generate verification OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: VerificationCodeType.email_verification,
        expiresAt
      }
    });

    console.log(`[SportNest Verification] Email verification code for ${email}: ${otpCode}`);

    return res.status(201).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Account registered successfully. Verify email using OTP.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration process failed due to system failure.'
      }
    });
  }
}

/**
 * Requests numeric OTP login validation token.
 */
export async function requestOtp(req: Request, res: Response) {
  try {
    const parse = otpRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request body failed data validation.',
          details: parse.error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }))
        }
      });
    }

    const { email } = parse.data;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No registered user was found with this email address.'
        }
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: VerificationCodeType.login_otp,
        expiresAt
      }
    });

    console.log(`[SportNest Auth] Login OTP passcode for ${email}: ${otpCode}`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Verification passcode has been transmitted via email.',
        expires_at: expiresAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('OTP request failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed generating authorization passcode.'
      }
    });
  }
}

/**
 * Validates login OTP and grants session JWT keys.
 */
export async function verifyOtp(req: Request, res: Response) {
  try {
    const parse = otpVerifySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request body failed data validation.',
          details: parse.error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }))
        }
      });
    }

    const { email, otp } = parse.data;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No registered user was found with this email address.'
        }
      });
    }

    // Verify code
    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        verifiedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Verification passcode is invalid, expired, or already used.'
        }
      });
    }

    // Mark code as verified
    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() }
    });

    // Mark user status as active if they were inactive (first verify)
    if (user.status === UserStatus.inactive) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.active }
      });
    }

    // Setup Session
    const jti = crypto.randomUUID();
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role, jti);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token: accessToken
      }
    });
  } catch (error: any) {
    console.error('OTP verify failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'System error during passcode verification.'
      }
    });
  }
}

/**
 * Performs refresh token rotation to grant a new access token.
 */
export async function refresh(req: Request, res: Response) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token is missing from the cookie context.'
        }
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token has expired or is invalid.'
        }
      });
    }

    const { sub, role, jti } = payload;
    if (!jti) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Malformed refresh token session.'
        }
      });
    }

    // Verify token exists in database and is not revoked
    const dbToken = await prisma.refreshToken.findFirst({
      where: { jti, userId: sub, revokedAt: null, expiresAt: { gt: new Date() } }
    });

    if (!dbToken) {
      // Replay attack protection: If token is valid but doesn't exist active in DB,
      // revoke all sessions for this user.
      await prisma.refreshToken.updateMany({
        where: { userId: sub },
        data: { revokedAt: new Date() }
      });
      res.clearCookie('refreshToken');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid session profile. Re-authenticate.'
        }
      });
    }

    // Rotate token
    const newJti = crypto.randomUUID();
    const newAccessToken = generateAccessToken(sub, role);
    const newRefreshToken = generateRefreshToken(sub, role, newJti);

    // Invalidate old token
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() }
    });

    // Create new token
    await prisma.refreshToken.create({
      data: {
        userId: sub,
        jti: newJti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        token: newAccessToken
      }
    });
  } catch (error: any) {
    console.error('Token refresh failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'System error during token rotation processing.'
      }
    });
  }
}

/**
 * Invalidates current session and clears the browser cookie.
 */
export async function logout(req: Request, res: Response) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const { sub, jti } = verifyRefreshToken(token);
        if (jti) {
          await prisma.refreshToken.updateMany({
            where: { jti, userId: sub },
            data: { revokedAt: new Date() }
          });
        }
      } catch (err) {
        // Silent catch: Token was already expired or malformed
      }
    }

    res.clearCookie('refreshToken');
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Logged out successfully.'
      }
    });
  } catch (error: any) {
    console.error('Logout failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'System error encountered during logout.'
      }
    });
  }
}

/**
 * Requests password reset token.
 */
export async function forgotPassword(req: Request, res: Response) {
  try {
    const parse = otpRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request body failed data validation.',
          details: parse.error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }))
        }
      });
    }

    const { email } = parse.data;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No registered user was found with this email address.'
        }
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: VerificationCodeType.password_reset,
        expiresAt
      }
    });

    console.log(`[SportNest Reset] Password reset token for ${email}: ${otpCode}`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Password reset code has been transmitted.'
      }
    });
  } catch (error: any) {
    console.error('Forgot password failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'System error compiling password reset request.'
      }
    });
  }
}

/**
 * Resets user password upon verified reset token.
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'The request body failed data validation.',
          details: parse.error.errors.map(err => ({ field: err.path.join('.'), issue: err.message }))
        }
      });
    }

    const { email, otp, newPassword } = parse.data;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No registered user was found with this email address.'
        }
      });
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: VerificationCodeType.password_reset,
        verifiedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Reset passcode is invalid, expired, or already used.'
        }
      });
    }

    // Hash and update
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.verificationCode.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() }
      }),
      // Revoke all existing sessions for safety on password change
      prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() }
      })
    ]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Password updated successfully. All active sessions have been revoked.'
      }
    });
  } catch (error: any) {
    console.error('Password reset failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'System error during password reset processing.'
      }
    });
  }
}
