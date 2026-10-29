import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendErrorResponse } from '../utils/api.response';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_uuid: string;
        email: string;
        username: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return sendErrorResponse(res, 401, 'Access token required');
  }

  // Verify token
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return sendErrorResponse(res, 403, 'Invalid or expired token');
  }

  // Check if user has logged out since this token was issued
  const user = await authService.getUserByUuid(decoded.user_uuid);
  if (!user || user.is_delete === 1) {
    return sendErrorResponse(res, 401, 'User account no longer active');
  }

  if (user.last_logout_at && decoded.iat) {
    const logoutTimestampSec = Math.floor(new Date(user.last_logout_at).getTime() / 1000);
    if (decoded.iat < logoutTimestampSec) {
      return sendErrorResponse(res, 401, 'Token invalidated due to logout. Please login again.');
    }
  }

  // Attach user to request
  req.user = decoded;
  next();
};

export const optionalAuthenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      const user = await authService.getUserByUuid(decoded.user_uuid);
      if (user && user.is_delete !== 1) {
        if (!user.last_logout_at || !decoded.iat || decoded.iat >= Math.floor(new Date(user.last_logout_at).getTime() / 1000)) {
          req.user = decoded;
        }
      }
    }
  }

  next();
};
