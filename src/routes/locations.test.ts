import request from "supertest";
import app from "../app";
import { resetInMemoryDb, inMemoryDonors } from "../db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bdcn-secure-secret-2026";

function generateToken(id: string, scopes: string[]) {
  return jwt.sign({ id, scopes }, JWT_SECRET, { expiresIn: "1h" });
}

describe("PUT /v1/locations/update", () => {
  beforeEach(() => {
    resetInMemoryDb();
  });

  it("should update coordinates successfully for active donor when valid scope and payload are provided", async () => {
    const token = generateToken("test-user-id", ["locations:write"]);
    const donor_token = "f81d4fae-7dec-11d0-a765-00a0c91e6bf6";
    const correlation_id = "c3b0759c-d1a4-49d2-941f-5e1234567890";

    const response = await request(app)
      .put("/v1/locations/update")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", correlation_id)
      .send({
        donor_token,
        latitude: 37.7858,
        longitude: -122.4008
      });

    expect(response.status).toBe(202);
    const donor = inMemoryDonors.get(donor_token);
    expect(donor).toBeDefined();
    expect(donor?.latitude).toBe(37.7858);
    expect(donor?.longitude).toBe(-122.4008);
  });

  it("should return 401 when authorization header is missing", async () => {
    const response = await request(app)
      .put("/v1/locations/update")
      .set("X-Correlation-ID", "c3b0759c-d1a4-49d2-941f-5e1234567890")
      .send({
        donor_token: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        latitude: 37.7858,
        longitude: -122.4008
      });

    expect(response.status).toBe(401);
    expect(response.body.error_code).toBe("UNAUTHORIZED");
  });

  it("should return 403 when authorization token does not have locations:write scope", async () => {
    const token = generateToken("test-user-id", ["matches:read"]);
    const response = await request(app)
      .put("/v1/locations/update")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", "c3b0759c-d1a4-49d2-941f-5e1234567890")
      .send({
        donor_token: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        latitude: 37.7858,
        longitude: -122.4008
      });

    expect(response.status).toBe(403);
    expect(response.body.error_code).toBe("FORBIDDEN");
  });

  it("should return 400 when X-Correlation-ID header is missing or invalid", async () => {
    const token = generateToken("test-user-id", ["locations:write"]);
    const response = await request(app)
      .put("/v1/locations/update")
      .set("Authorization", `Bearer ${token}`)
      .send({
        donor_token: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        latitude: 37.7858,
        longitude: -122.4008
      });

    expect(response.status).toBe(400);
    expect(response.body.error_code).toBe("INVALID_CORRELATION_ID");
  });

  it("should return 400 when latitude is out of bounds", async () => {
    const token = generateToken("test-user-id", ["locations:write"]);
    const response = await request(app)
      .put("/v1/locations/update")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Correlation-ID", "c3b0759c-d1a4-49d2-941f-5e1234567890")
      .send({
        donor_token: "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
        latitude: 120.0,
        longitude: -122.4008
      });

    expect(response.status).toBe(400);
    expect(response.body.error_code).toBe("INVALID_COORDINATES");
  });
});
