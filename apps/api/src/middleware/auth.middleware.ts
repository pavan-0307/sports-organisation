import { Request, Response, NextFunction } from 'express';
import { TokenPayload, verifyAccessToken } from '../utils/token.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware verifying JWT Bearer token inside incoming Authorization header
 */
export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is missing or malformed.'
      }
    });
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token is expired or invalid.'
      }
    });
  }
}

/**
 * Middleware matching authenticated user's role against permissions whitelist
 */
export function authorizeRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient access privileges to access this resource.'
        }
      });
    }
    next();
  };
}
