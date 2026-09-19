-- =============================================================================
-- NaviOps — Port Congestion Prediction & Operations Optimizer
-- Database Schema DDL for Supabase PostgreSQL (Stored in src/database)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS vessel_crane_assignments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS optimization_runs CASCADE;
DROP TABLE IF EXISTS disruptions CASCADE;
DROP TABLE IF EXISTS yards CASCADE;
DROP TABLE IF EXISTS cranes CASCADE;
DROP TABLE IF EXISTS berths CASCADE;
DROP TABLE IF EXISTS vessels CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (Role-Based Access Control)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operations', 'viewer')),
    department VARCHAR(100) DEFAULT 'Port Operations',
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Berths Table
CREATE TABLE berths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    berth_code VARCHAR(20) UNIQUE NOT NULL,
    berth_name VARCHAR(100) NOT NULL,
    max_vessel_length NUMERIC(6,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Unavailable')),
    current_vessel_id UUID,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Vessels Table
CREATE TABLE vessels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_code VARCHAR(30) UNIQUE NOT NULL,
    vessel_name VARCHAR(100) NOT NULL,
    shipping_line VARCHAR(100) NOT NULL,
    cargo_type VARCHAR(50) NOT NULL CHECK (cargo_type IN ('Container', 'Bulk', 'Liquid', 'Ro-Ro', 'General Cargo')),
    cargo_volume INTEGER NOT NULL CHECK (cargo_volume > 0),
    vessel_length NUMERIC(6,2) NOT NULL CHECK (vessel_length > 0),
    arrival_time TIMESTAMPTZ,
    eta TIMESTAMPTZ NOT NULL,
    etd TIMESTAMPTZ NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
    status VARCHAR(30) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Arrived', 'Waiting', 'Berthing', 'Loading', 'Unloading', 'Completed', 'Delayed')),
    assigned_berth_id UUID REFERENCES berths(id) ON DELETE SET NULL,
    expected_waiting_time NUMERIC(6,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE berths 
    ADD CONSTRAINT fk_berths_current_vessel 
    FOREIGN KEY (current_vessel_id) 
    REFERENCES vessels(id) 
    ON DELETE SET NULL;

-- 4. Cranes Table
CREATE TABLE cranes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crane_code VARCHAR(20) UNIQUE NOT NULL,
    crane_name VARCHAR(100) NOT NULL,
    capacity_per_hour INTEGER NOT NULL DEFAULT 35,
    status VARCHAR(30) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Busy', 'Maintenance', 'Failed')),
    current_vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    assigned_berth_id UUID REFERENCES berths(id) ON DELETE SET NULL,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Yards Table
CREATE TABLE yards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yard_code VARCHAR(20) UNIQUE NOT NULL,
    yard_name VARCHAR(100) NOT NULL,
    cargo_type VARCHAR(50) NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    occupied_capacity INTEGER NOT NULL DEFAULT 0 CHECK (occupied_capacity >= 0),
    utilization_percentage NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((occupied_capacity::NUMERIC / total_capacity::NUMERIC) * 100, 2)) STORED,
    status VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (status IN ('Normal', 'Congested', 'Near Capacity', 'Maintenance')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Disruptions Table
CREATE TABLE disruptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disruption_type VARCHAR(50) NOT NULL CHECK (disruption_type IN ('Equipment Failure', 'Weather', 'Berth Maintenance', 'Yard Congestion', 'Vessel Delay', 'Labor Shortage')),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    affected_resource_type VARCHAR(50) NOT NULL CHECK (affected_resource_type IN ('vessel', 'berth', 'crane', 'yard', 'port')),
    affected_resource_id UUID,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved', 'Mitigated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Optimization Runs Table
CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planning_horizon_start TIMESTAMPTZ NOT NULL,
    planning_horizon_end TIMESTAMPTZ NOT NULL,
    objective_value NUMERIC(12,2),
    total_waiting_time NUMERIC(10,2),
    total_delay NUMERIC(10,2),
    status VARCHAR(30) NOT NULL DEFAULT 'OPTIMAL' CHECK (status IN ('OPTIMAL', 'FEASIBLE', 'INFEASIBLE', 'FAILED')),
    metrics_json JSONB,
    applied BOOLEAN DEFAULT FALSE,
    applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Schedules Table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimization_run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    berth_id UUID NOT NULL REFERENCES berths(id) ON DELETE CASCADE,
    planned_start TIMESTAMPTZ NOT NULL,
    planned_end TIMESTAMPTZ NOT NULL,
    waiting_time NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    assigned_cranes JSONB DEFAULT '[]'::jsonb,
    assignment_reason TEXT,
    status VARCHAR(30) DEFAULT 'Proposed' CHECK (status IN ('Proposed', 'Approved', 'Applied', 'Rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Vessel Crane Assignments Table
CREATE TABLE vessel_crane_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    crane_id UUID NOT NULL REFERENCES cranes(id) ON DELETE CASCADE,
    assigned_from TIMESTAMPTZ NOT NULL,
    assigned_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled'))
);

CREATE INDEX idx_vessels_status ON vessels(status);
CREATE INDEX idx_vessels_eta ON vessels(eta);
CREATE INDEX idx_vessels_berth ON vessels(assigned_berth_id);
CREATE INDEX idx_berths_status ON berths(status);
CREATE INDEX idx_cranes_status ON cranes(status);
CREATE INDEX idx_disruptions_status ON disruptions(status);
CREATE INDEX idx_disruptions_resource ON disruptions(affected_resource_type, affected_resource_id);
CREATE INDEX idx_schedules_run ON schedules(optimization_run_id);
