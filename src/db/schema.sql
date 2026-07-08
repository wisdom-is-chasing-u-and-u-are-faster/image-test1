-- Liquibase / Flyway Database Migration Changelog
-- Database: PostgreSQL (with PostGIS Extension)
-- Release Version: 1.0.0
-- Description: Initializes the Geospatial Matching Engine schema, spatial indexes, and security constraints.

-- Ensure PostGIS extension is installed in the public schema
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- Table: donor_locations
CREATE TABLE IF NOT EXISTS public.donor_locations (
    donor_token UUID PRIMARY KEY,
    current_location public.GEOMETRY(Point, 4326) NOT NULL,
    blood_type VARCHAR(5) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT chk_blood_type CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);

-- Table: match_queries_log
CREATE TABLE IF NOT EXISTS public.match_queries_log (
    query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL,
    request_location public.GEOMETRY(Point, 4326) NOT NULL,
    requested_blood_type VARCHAR(5) NOT NULL,
    search_radius_meters NUMERIC(8, 2) NOT NULL,
    execution_time_ms INT NOT NULL,
    matches_found INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Spatial Index (GIST) for fast radial and distance queries
CREATE INDEX IF NOT EXISTS idx_donor_locations_spatial 
ON public.donor_locations USING GIST(current_location);

-- B-Tree Index on blood type for composite filtering
CREATE INDEX IF NOT EXISTS idx_donor_locations_blood_type 
ON public.donor_locations(blood_type) 
WHERE is_available = TRUE;

-- Index on last_updated to identify stale location data for cleanup
CREATE INDEX IF NOT EXISTS idx_donor_locations_staleness 
ON public.donor_locations(last_updated);

-- Index on match queries log for hospital auditing
CREATE INDEX IF NOT EXISTS idx_match_queries_hospital 
ON public.match_queries_log(hospital_id, created_at DESC);

-- Function to automatically update the last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute timestamp updates on location changes
CREATE TRIGGER trg_donor_locations_last_updated
BEFORE UPDATE ON public.donor_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_last_updated_column();
