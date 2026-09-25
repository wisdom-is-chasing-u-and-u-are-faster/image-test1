-- Migration: 004_skills_and_capacities.sql
-- Description: Skills taxonomy, user skill matrix, and agent capacity limits for intelligent routing

CREATE TABLE IF NOT EXISTS skills (
    skill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_code VARCHAR(32) UNIQUE NOT NULL,
    skill_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS agent_capacity (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    max_concurrent_p1_p2 INT NOT NULL DEFAULT 5,
    max_total_active INT NOT NULL DEFAULT 15,
    is_accepting_tickets BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id, user_id);
