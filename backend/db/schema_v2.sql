-- Schema v2: Modality-agnostic inventory system
-- Supports both RFID and Vision-based tracking
-- Created: March 11, 2026

CREATE SCHEMA IF NOT EXISTS v2;
SET search_path TO v2, public;

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nfc_card_uid VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user', -- user, admin, staff
    password_hash VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_nfc_card_uid ON users(nfc_card_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2. Item Types
CREATE TABLE item_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_types_name ON item_types(name);
CREATE INDEX idx_item_types_active ON item_types(active);

-- 3. Item Type Images
CREATE TABLE item_type_images (
    id SERIAL PRIMARY KEY,
    item_type_id INTEGER NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_item_type_images_item_type_id ON item_type_images(item_type_id);
CREATE INDEX idx_item_type_images_is_primary ON item_type_images(is_primary);

-- 4. Storage Units
CREATE TABLE storage_units (
    id SERIAL PRIMARY KEY,
    unit_type VARCHAR(50) NOT NULL, -- drawer, shelf, hanger_cabinet
    layout_type VARCHAR(50) NOT NULL, -- grid, zone, none
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_units_unit_type ON storage_units(unit_type);
CREATE INDEX idx_storage_units_layout_type ON storage_units(layout_type);

-- 5. Storage Locations
CREATE TABLE storage_locations (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES storage_units(id) ON DELETE CASCADE,
    level_no INTEGER NOT NULL,
    row_no INTEGER, -- nullable for zone layout
    col_no INTEGER, -- nullable for zone layout
    zone_code VARCHAR(50), -- nullable for grid layout
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_locations_unit_id ON storage_locations(unit_id);
CREATE INDEX idx_storage_locations_location ON storage_locations(unit_id, level_no);
-- Unique constraints based on layout type are enforced at app level
CREATE UNIQUE INDEX idx_storage_locations_grid ON storage_locations(unit_id, level_no, row_no, col_no)
    WHERE row_no IS NOT NULL AND col_no IS NOT NULL;
CREATE UNIQUE INDEX idx_storage_locations_zone ON storage_locations(unit_id, level_no, zone_code)
    WHERE zone_code IS NOT NULL;

-- 6. Access Sessions
CREATE TABLE access_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    unit_id INTEGER NOT NULL REFERENCES storage_units(id) ON DELETE RESTRICT,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open', -- open, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_sessions_user_id ON access_sessions(user_id);
CREATE INDEX idx_access_sessions_unit_id ON access_sessions(unit_id);
CREATE INDEX idx_access_sessions_status ON access_sessions(status);
CREATE INDEX idx_access_sessions_opened_at ON access_sessions(opened_at);

-- 7. Observations (central hub for all sensor data)
CREATE TABLE observations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES access_sessions(id) ON DELETE RESTRICT,
    location_id INTEGER REFERENCES storage_locations(id) ON DELETE SET NULL, -- nullable for RFID
    source_type VARCHAR(50) NOT NULL, -- rfid, vision
    change_type VARCHAR(50) NOT NULL, -- added, removed, changed, unchanged, unknown
    confidence FLOAT CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    review_status VARCHAR(50) DEFAULT 'normal', -- normal, needs_review, resolved
    review_note TEXT,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_observations_session_id ON observations(session_id);
CREATE INDEX idx_observations_location_id ON observations(location_id);
CREATE INDEX idx_observations_source_type ON observations(source_type);
CREATE INDEX idx_observations_review_status ON observations(review_status);
CREATE INDEX idx_observations_observed_at ON observations(observed_at);

-- 8. RFID Observation Details
CREATE TABLE rfid_observation_details (
    observation_id INTEGER PRIMARY KEY REFERENCES observations(id) ON DELETE CASCADE,
    tag_uid VARCHAR(255) NOT NULL,
    reader_id VARCHAR(255),
    rssi INTEGER,
    read_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rfid_observation_details_tag_uid ON rfid_observation_details(tag_uid);

-- 9. Vision Observation Details
CREATE TABLE vision_observation_details (
    observation_id INTEGER PRIMARY KEY REFERENCES observations(id) ON DELETE CASCADE,
    before_image_url VARCHAR(500),
    after_image_url VARCHAR(500),
    crop_url VARCHAR(500),
    model_version VARCHAR(100),
    raw_predictions_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Inventory Events (business truth)
CREATE TABLE inventory_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES access_sessions(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    item_type_id INTEGER NOT NULL REFERENCES item_types(id) ON DELETE RESTRICT,
    event_type VARCHAR(50) NOT NULL, -- borrow, return, adjustment, manual_resolution
    quantity INTEGER NOT NULL DEFAULT 1,
    location_id INTEGER REFERENCES storage_locations(id) ON DELETE SET NULL,
    observation_id INTEGER REFERENCES observations(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_events_session_id ON inventory_events(session_id);
CREATE INDEX idx_inventory_events_user_id ON inventory_events(user_id);
CREATE INDEX idx_inventory_events_item_type_id ON inventory_events(item_type_id);
CREATE INDEX idx_inventory_events_event_type ON inventory_events(event_type);
CREATE INDEX idx_inventory_events_created_at ON inventory_events(created_at);

-- 11. Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor_type VARCHAR(50) NOT NULL, -- user, system, device, admin
    actor_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- scan, unlock, lock, approve, sync, violation, login
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    result VARCHAR(50), -- success, failed
    ip_address VARCHAR(45),
    message TEXT,
    correlation_id VARCHAR(255)
);

CREATE INDEX idx_audit_logs_ts ON audit_logs(ts);
CREATE INDEX idx_audit_logs_actor_type ON audit_logs(actor_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_correlation_id ON audit_logs(correlation_id);

-- 12. Slot Occupancies (cache for current state)
CREATE TABLE slot_occupancies (
    location_id INTEGER PRIMARY KEY REFERENCES storage_locations(id) ON DELETE CASCADE,
    state VARCHAR(50) DEFAULT 'unknown', -- empty, occupied, unknown, error
    item_type_id INTEGER REFERENCES item_types(id) ON DELETE SET NULL,
    confidence FLOAT CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0)),
    last_event_id INTEGER REFERENCES inventory_events(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slot_occupancies_state ON slot_occupancies(state);
CREATE INDEX idx_slot_occupancies_item_type_id ON slot_occupancies(item_type_id);

-- Constraints and Business Rules

-- Ensure Vision observations have location_id
ALTER TABLE observations ADD CONSTRAINT ck_vision_needs_location
    CHECK (source_type != 'vision' OR location_id IS NOT NULL);

-- Ensure RFID observations have rfid details
ALTER TABLE rfid_observation_details ADD CONSTRAINT ck_rfid_detail_valid
    CHECK (tag_uid IS NOT NULL);

-- NOTE:
-- PostgreSQL does not allow subqueries inside CHECK constraints.
-- The cross-table validation between inventory_events.location_id and
-- access_sessions.unit_id should be enforced in application logic or via trigger.
