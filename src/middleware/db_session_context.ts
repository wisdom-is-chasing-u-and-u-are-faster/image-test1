import { Request, Response, NextFunction } from 'express';
import { extractClaims, DecodedClaims } from '../security/jwt_claims_extractor';

declare global {
  namespace Express {
    interface Request {
      userContext?: DecodedClaims;
    }
  }
}

export function dbSessionContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      req.userContext = extractClaims(authHeader);
    }
    next();
  } catch (error) {
    next(error);
  }
}
