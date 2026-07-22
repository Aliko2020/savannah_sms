import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';
import { Role } from '../generated/prisma/client';

interface JwtPayload {
  userId: string;
  role: Role;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token.', 401));
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};
