import jwt from 'jsonwebtoken';
import { serverConfig } from '../config';
import { UnauthorizedError } from '../errors/rfc7807.error';

export interface DecodedClaims {
  userId: string;
  email: string;
  role: string;
  departmentId: string;
  firstName?: string;
  lastName?: string;
}

export function extractClaims(authHeader?: string): DecodedClaims {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header with Bearer token.');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, serverConfig.jwtSecret) as any;
    return {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'REQUESTER',
      departmentId: decoded.departmentId,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };
  } catch (err: any) {
    throw new UnauthorizedError(`Invalid authentication token: ${err.message}`);
  }
}
