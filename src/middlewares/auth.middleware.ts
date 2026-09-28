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

export const authenticateToken = (
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

  // Attach user to request
  req.user = decoded;
  next();
};

export const optionalAuthenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
