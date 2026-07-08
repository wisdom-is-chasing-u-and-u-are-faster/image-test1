import { Request, Response, NextFunction } from "express";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function validateCorrelationId(req: Request, res: Response, next: NextFunction) {
  const correlationId = req.headers["x-correlation-id"];
  if (!correlationId || typeof correlationId !== "string" || !UUID_REGEX.test(correlationId)) {
    return res.status(400).json({
      error_code: "INVALID_CORRELATION_ID",
      message: "X-Correlation-ID header is required and must be a valid UUIDv4.",
      timestamp: new Date().toISOString()
    });
  }
  next();
}

export function validateLocationUpdate(req: Request, res: Response, next: NextFunction) {
  const { donor_token, latitude, longitude } = req.body;

  if (!donor_token || typeof donor_token !== "string" || !UUID_REGEX.test(donor_token)) {
    return res.status(400).json({
      error_code: "INVALID_DONOR_TOKEN",
      message: "donor_token is required and must be a valid UUIDv4.",
      timestamp: new Date().toISOString()
    });
  }

  if (latitude === undefined || typeof latitude !== "number" || latitude < -90.0 || latitude > 90.0) {
    return res.status(400).json({
      error_code: "INVALID_COORDINATES",
      message: "latitude is required and must be a number between -90 and 90 degrees.",
      timestamp: new Date().toISOString()
    });
  }

  if (longitude === undefined || typeof longitude !== "number" || longitude < -180.0 || longitude > 180.0) {
    return res.status(400).json({
      error_code: "INVALID_COORDINATES",
      message: "longitude is required and must be a number between -180 and 180 degrees.",
      timestamp: new Date().toISOString()
    });
  }

  next();
}

export function validateMatchRequest(req: Request, res: Response, next: NextFunction) {
  const { hospital_id, latitude, longitude, blood_type, radius_km } = req.body;

  if (!hospital_id || typeof hospital_id !== "string" || !UUID_REGEX.test(hospital_id)) {
    return res.status(400).json({
      error_code: "INVALID_HOSPITAL_ID",
      message: "hospital_id is required and must be a valid UUIDv4.",
      timestamp: new Date().toISOString()
    });
  }

  if (latitude === undefined || typeof latitude !== "number" || latitude < -90.0 || latitude > 90.0) {
    return res.status(400).json({
      error_code: "INVALID_COORDINATES",
      message: "latitude is required and must be a number between -90 and 90 degrees.",
      timestamp: new Date().toISOString()
    });
  }

  if (longitude === undefined || typeof longitude !== "number" || longitude < -180.0 || longitude > 180.0) {
    return res.status(400).json({
      error_code: "INVALID_COORDINATES",
      message: "longitude is required and must be a number between -180 and 180 degrees.",
      timestamp: new Date().toISOString()
    });
  }

  if (!blood_type || typeof blood_type !== "string" || !BLOOD_TYPES.includes(blood_type)) {
    return res.status(400).json({
      error_code: "INVALID_BLOOD_TYPE",
      message: `blood_type must be one of: ${BLOOD_TYPES.join(", ")}`,
      timestamp: new Date().toISOString()
    });
  }

  if (radius_km !== undefined) {
    if (typeof radius_km !== "number" || radius_km < 1.0 || radius_km > 150.0) {
      return res.status(400).json({
        error_code: "INVALID_RADIUS",
        message: "radius_km must be a number between 1.0 and 150.0 km.",
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
}
