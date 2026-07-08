import { Router, Response } from "express";
import { query } from "../db";
import { enforceScope, AuthenticatedRequest } from "../middleware/auth";
import { validateCorrelationId, validateLocationUpdate } from "../middleware/validate";

const router = Router();

// PUT /v1/locations/update
router.put(
  "/update",
  validateCorrelationId,
  enforceScope("locations:write"),
  validateLocationUpdate,
  async (req: AuthenticatedRequest, res: Response) => {
    const { donor_token, latitude, longitude } = req.body;

    try {
      // Check if donor exists
      const checkResult = await query(
        "SELECT donor_token FROM public.donor_locations WHERE donor_token = $1",
        [donor_token]
      );

      if (checkResult.rowCount === 0) {
        // If not exists, insert with a default compatible blood type O-
        await query(
          `INSERT INTO public.donor_locations (donor_token, current_location, blood_type, is_available) 
           VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)`,
          [donor_token, longitude, latitude, "O-", true]
        );
      } else {
        // If exists, update coordinates
        await query(
          `UPDATE public.donor_locations 
           SET current_location = ST_SetSRID(ST_MakePoint($2, $3), 4326) 
           WHERE donor_token = $1`,
          [donor_token, longitude, latitude]
        );
      }

      return res.status(202).send();
    } catch (err: any) {
      console.error("Error updating location:", err);
      return res.status(500).json({
        error_code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while updating the coordinates.",
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
