import { Response } from 'express';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const prisma = new PrismaClient();

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole)
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus)
});

/**
 * Returns a list of all registered users (excluding password hashes).
 */
export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);

    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Failed to list users:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not fetch user records.'
      }
    });
  }
}

/**
 * Updates a user's access role (Super Admin action).
 */
export async function updateUserRole(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Prevent changing own role to avoid locking oneself out of Super Admin
    if (req.user?.sub === id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Users cannot modify their own security roles.'
        }
      });
    }

    const parse = updateRoleSchema.safeParse(req.body);
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

    const { role } = parse.data;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active user record matches the provided identifier.'
        }
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'User role updated successfully.',
        user: updated
      }
    });
  } catch (error: any) {
    console.error('Failed to update user role:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not modify user role configurations.'
      }
    });
  }
}

/**
 * Suspends or activates a user account (Admin/Super Admin action).
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Prevent suspending oneself
    if (req.user?.sub === id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Users cannot suspend or change their own account status.'
        }
      });
    }

    const parse = updateStatusSchema.safeParse(req.body);
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

    const { status } = parse.data;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No active user record matches the provided identifier.'
        }
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true }
    });

    // If status is suspended or inactive, revoke all active sessions for this user for security
    if (status !== UserStatus.active) {
      await prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() }
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'User account status updated successfully.',
        user: updated
      }
    });
  } catch (error: any) {
    console.error('Failed to update user status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Could not modify user account status.'
      }
    });
  }
}

/**
 * Returns current authenticated user metadata.
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access session details missing.'
        }
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Active profile details not found.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data: { user }
    });
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed retrieving authenticated profile context.'
      }
    });
  }
}
