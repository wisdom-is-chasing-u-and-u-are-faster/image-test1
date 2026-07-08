import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bdcn-secure-secret-2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    scopes: string[];
  };
}

export function enforceScope(requiredScope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error_code: "UNAUTHORIZED",
        message: "Authorization header with Bearer token is required.",
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.split(" ")[1];
    try {
      // Decode token
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        scopes?: string[];
        scope?: string;
      };

      // Extract scopes from either 'scopes' array or 'scope' string space-separated
      const scopes = decoded.scopes || (decoded.scope ? decoded.scope.split(" ") : []);
      
      if (!scopes.includes(requiredScope)) {
        return res.status(403).json({
          error_code: "FORBIDDEN",
          message: `Insufficient permissions. Required scope: ${requiredScope}`,
          timestamp: new Date().toISOString()
        });
      }

      req.user = {
        id: decoded.id,
        scopes
      };
      next();
    } catch (err) {
      return res.status(401).json({
        error_code: "UNAUTHORIZED",
        message: "Invalid or expired token.",
        timestamp: new Date().toISOString()
      });
    }
  };
}
