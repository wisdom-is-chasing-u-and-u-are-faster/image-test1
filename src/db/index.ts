import { Pool } from "pg";

// Blood compatibility matrix: requested_blood_type -> compatible donor blood types
export const COMPATIBLE_DONORS: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
};

// Haversine formula to compute spatial distances in kilometers
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// In-Memory Storage for fallbacks/testing
export interface InMemoryDonor {
  donor_token: string;
  latitude: number;
  longitude: number;
  blood_type: string;
  is_available: boolean;
  last_updated: Date;
}

export interface InMemoryQueryLog {
  query_id: string;
  hospital_id: string;
  latitude: number;
  longitude: number;
  requested_blood_type: string;
  search_radius_meters: number;
  execution_time_ms: number;
  matches_found: number;
  created_at: Date;
}

export const inMemoryDonors: Map<string, InMemoryDonor> = new Map();
export const inMemoryLogs: InMemoryQueryLog[] = [];

// Real pg client setup
const useRealDb = !!process.env.DATABASE_URL;
let pool: Pool | null = null;

if (useRealDb) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
}

export async function query(text: string, params: any[] = []): Promise<any> {
  if (pool) {
    return pool.query(text, params);
  }

  // In-Memory Fallback Router
  const queryStr = text.toLowerCase().replace(/\s+/g, " ").trim();

  // 1. UPDATE/INSERT donor_locations
  if (queryStr.includes("insert into public.donor_locations") || queryStr.includes("insert into donor_locations")) {
    // Expected args: [donor_token, longitude, latitude, blood_type, is_available]
    // Or upsert coordinates: [donor_token, longitude, latitude]
    const donor_token = params[0];
    const longitude = params[1];
    const latitude = params[2];
    
    let donor = inMemoryDonors.get(donor_token);
    if (!donor) {
      const blood_type = params[3] || "O-";
      const is_available = params[4] !== undefined ? params[4] : true;
      donor = {
        donor_token,
        latitude,
        longitude,
        blood_type,
        is_available,
        last_updated: new Date()
      };
    } else {
      donor.latitude = latitude;
      donor.longitude = longitude;
      donor.last_updated = new Date();
    }
    inMemoryDonors.set(donor_token, donor);
    return { rowCount: 1, rows: [donor] };
  }

  // 2. INSERT match_queries_log
  if (queryStr.includes("insert into public.match_queries_log") || queryStr.includes("insert into match_queries_log")) {
    const query_id = Math.random().toString(36).substring(7);
    const log: InMemoryQueryLog = {
      query_id,
      hospital_id: params[0],
      latitude: params[1], // request_location
      longitude: params[2],
      requested_blood_type: params[3],
      search_radius_meters: params[4],
      execution_time_ms: params[5],
      matches_found: params[6],
      created_at: new Date()
    };
    inMemoryLogs.push(log);
    return { rowCount: 1, rows: [log] };
  }

  // 3. SELECT locations query
  if (queryStr.includes("select") && queryStr.includes("donor_locations")) {
    // Radial search simulation
    // params: [hospital_longitude, hospital_latitude, requested_blood_type (or allowed_bloods array), radius_meters]
    const hLon = params[0];
    const hLat = params[1];
    const allowedBloodsInput = params[2];
    const radiusMeters = params[3];

    const allowedBloods = Array.isArray(allowedBloodsInput) 
      ? allowedBloodsInput 
      : (COMPATIBLE_DONORS[allowedBloodsInput] || []);

    const results = Array.from(inMemoryDonors.values())
      .filter(d => d.is_available && allowedBloods.includes(d.blood_type))
      .map(d => {
        const distanceKm = getHaversineDistance(hLat, hLon, d.latitude, d.longitude);
        return {
          donor_token: d.donor_token,
          distance_km: parseFloat(distanceKm.toFixed(2)),
          estimated_driving_time_mins: Math.round(distanceKm * 2) // mock: 2 mins per km
        };
      })
      .filter(r => r.distance_km * 1000 <= radiusMeters);

    return { rowCount: results.length, rows: results };
  }

  return { rowCount: 0, rows: [] };
}

export function resetInMemoryDb() {
  inMemoryDonors.clear();
  inMemoryLogs.length = 0;
}
