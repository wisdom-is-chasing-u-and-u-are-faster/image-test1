import request from "supertest";
import app from "../app";
import { resetInMemoryDb, query, inMemoryLogs } from "../db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bdcn-secure-secret-2026";

function generateToken(id: string, scopes: string[]) {
  return jwt.sign({ id, scopes }, JWT_SECRET, { expiresIn: "1h" });
}

describe("POST /v1/matches/search", () => {
  beforeEach(async () => {
    resetInMemoryDb();

    // Set up test donor locations
    // Donor A (SF, ~2km away, O-)
    await query(
      "INSERT INTO public.donor_locations (donor_token, current_location, blood_type, is_available) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)",
      ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6", -122.4008, 37.7858, "O-", true]
    );

    // Donor B (Sacramento, ~120km away, O-)
    await query(
      "INSERT INTO public.donor_locations (donor_token, current_location, blood_type, is_available) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)",
      ["f81d4fae-7dec-11d0-a765-00a0c91e6bf7", -121.4944, 38.5816, "O-", true]
    );

    // Donor C (SF, ~2km away, O+)
    await query(
      "INSERT INTO public.donor_locations (donor_token, current_location, blood_type, is_available) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)",
      ["f81d4fae-7dec-11d0-a765-00a0c91e6bf8", -122.4008, 37.7858, "O+", true]
    );

    // Donor D (SF, ~2km away, B+, unavailable)
    await query(
      "INSERT INTO public.donor_locations (donor_token, current_location, blood_type, is_available) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)",
      ["f81d4fae-7dec-11d0-a765-00a0c91e6bf9", -122.4008, 37.7858, "B+", false]
    );
  });

  it("should match only compatible donors within specified geographic radius (TC-001)", async () => {
    const token = generateToken("test-user-id", ["matches:read"]);
    const correlation_id = "c3b0759c-d1a4-49d2-941f-5e1234567890";

    const response = await request(app)
      .post("/v1/matches/search")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", correlation_id)
      .send({
        hospital_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        latitude: 37.7749, // San Francisco hospital
        longitude: -122.4194,
        blood_type: "O-", // Requested O-
        radius_km: 50.0 // 50km radius
      });

    expect(response.status).toBe(200);
    expect(response.body.search_radius_km).toBe(50.0);
    expect(response.body.total_matches_found).toBe(1);
    expect(response.body.matches[0].donor_token).toBe("f81d4fae-7dec-11d0-a765-00a0c91e6bf6"); // Donor A matches
    // Donor B is 120km away (excluded by radius)
    // Donor C is O+ (excluded by compatibility for O-)
    // Donor D is unavailable (excluded)

    // Check custom metrics header
    expect(response.headers["x-query-execution-time-ms"]).toBeDefined();

    // Check audit log insertion
    expect(inMemoryLogs.length).toBe(1);
    expect(inMemoryLogs[0].matches_found).toBe(1);
    expect(inMemoryLogs[0].requested_blood_type).toBe("O-");
  });

  it("should support full blood compatibility rules correctly (Recipient A+)", async () => {
    const token = generateToken("test-user-id", ["matches:read"]);
    const correlation_id = "c3b0759c-d1a4-49d2-941f-5e1234567890";

    const response = await request(app)
      .post("/v1/matches/search")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", correlation_id)
      .send({
        hospital_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        latitude: 37.7749,
        longitude: -122.4194,
        blood_type: "A+", // Recipient is A+ (can receive from O-, O+, A-, A+)
        radius_km: 50.0
      });

    expect(response.status).toBe(200);
    // Donor A (O-) and Donor C (O+) are within 50km and are compatible
    expect(response.body.total_matches_found).toBe(2);
    const tokens = response.body.matches.map((m: any) => m.donor_token);
    expect(tokens).toContain("f81d4fae-7dec-11d0-a765-00a0c91e6bf6"); // Donor A (O-)
    expect(tokens).toContain("f81d4fae-7dec-11d0-a765-00a0c91e6bf8"); // Donor C (O+)
  });

  it("should return 403 when authorization token does not have matches:read scope (TC-003)", async () => {
    const token = generateToken("test-user-id", ["locations:write"]);
    const response = await request(app)
      .post("/v1/matches/search")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", "c3b0759c-d1a4-49d2-941f-5e1234567890")
      .send({
        hospital_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        latitude: 37.7749,
        longitude: -122.4194,
        blood_type: "O-",
        radius_km: 50.0
      });

    expect(response.status).toBe(403);
    expect(response.body.error_code).toBe("FORBIDDEN");
  });
});
