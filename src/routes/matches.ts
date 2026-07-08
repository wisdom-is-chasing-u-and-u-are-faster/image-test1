import { Router, Response } from "express";
import { query, COMPATIBLE_DONORS } from "../db";
import { enforceScope, AuthenticatedRequest } from "../middleware/auth";
import { validateCorrelationId, validateMatchRequest } from "../middleware/validate";

const router = Router();

// POST /v1/matches/search
router.post(
  "/search",
  validateCorrelationId,
  enforceScope("matches:read"),
  validateMatchRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    const start = Date.now();
    const { hospital_id, latitude, longitude, blood_type, radius_km = 50.0 } = req.body;
    const radiusMeters = radius_km * 1000.0;
    const allowedBloods = COMPATIBLE_DONORS[blood_type] || [];

    try {
      // Find matches in PostgreSQL/PostGIS (or fallback in-memory)
      const matchesResult = await query(
        `SELECT donor_token, 
                ST_Distance(current_location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
         FROM public.donor_locations
         WHERE is_available = TRUE 
           AND blood_type = ANY($3::varchar[])
           AND ST_DWithin(current_location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $4)`,
        [longitude, latitude, allowedBloods, radiusMeters]
      );

      const dbEnd = Date.now();
      const executionTimeMs = dbEnd - start;

      // Log matching query
      await query(
        `INSERT INTO public.match_queries_log (hospital_id, request_location, requested_blood_type, search_radius_meters, execution_time_ms, matches_found)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7)`,
        [
          hospital_id,
          longitude,
          latitude,
          blood_type,
          radiusMeters,
          executionTimeMs,
          matchesResult.rowCount
        ]
      );

      // Structure responses
      const match_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const matches = matchesResult.rows.map((row: any) => ({
        donor_token: row.donor_token,
        distance_km: parseFloat(row.distance_km || row.distance_km === 0 ? row.distance_km.toFixed(2) : "0"),
        estimated_driving_time_mins: Math.round((row.distance_km || 0) * 2) // Estimated 2 mins per km
      }));

      // Set custom performance header
      res.setHeader("X-Query-Execution-Time-MS", executionTimeMs);

      return res.status(200).json({
        match_id,
        search_radius_km: radius_km,
        total_matches_found: matches.length,
        matches
      });
    } catch (err: any) {
      console.error("Error matching donors:", err);
      return res.status(500).json({
        error_code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while executing the matching query.",
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
