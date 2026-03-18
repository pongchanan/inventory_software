--
-- PostgreSQL database dump
--

\restrict mJHx9Pu2onudK3c8Xmi5RLeK7pIDYFg99aL9VW30lAKSEw295U5bSJPMBaoTxOv

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: v2; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA v2;


ALTER SCHEMA v2 OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approvals (
    id integer NOT NULL,
    user_uid character varying NOT NULL,
    item_uid character varying NOT NULL,
    requested_at timestamp without time zone,
    status character varying,
    priority character varying,
    reason character varying,
    duration_days integer,
    admin_uid character varying,
    resolved_at timestamp without time zone,
    admin_notes character varying
);


ALTER TABLE public.approvals OWNER TO postgres;

--
-- Name: approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approvals_id_seq OWNER TO postgres;

--
-- Name: approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approvals_id_seq OWNED BY public.approvals.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "timestamp" timestamp without time zone,
    type character varying NOT NULL,
    "user" character varying NOT NULL,
    item character varying,
    status character varying,
    message character varying,
    ip_address character varying
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: compartments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compartments (
    id integer NOT NULL,
    floor integer NOT NULL,
    locker_number character varying NOT NULL,
    status character varying,
    item_uid character varying,
    user_uid character varying,
    occupied_at timestamp without time zone,
    due_at timestamp without time zone
);


ALTER TABLE public.compartments OWNER TO postgres;

--
-- Name: compartments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compartments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compartments_id_seq OWNER TO postgres;

--
-- Name: compartments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compartments_id_seq OWNED BY public.compartments.id;


--
-- Name: detection_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detection_events (
    id integer NOT NULL,
    session_id integer NOT NULL,
    slot_id integer NOT NULL,
    before_snapshot_id integer,
    after_snapshot_id integer,
    change_type character varying NOT NULL,
    predicted_item_type_id integer,
    similarity_score double precision,
    mask_area double precision,
    crop_image_url character varying,
    raw_predictions text,
    detected_at timestamp without time zone
);


ALTER TABLE public.detection_events OWNER TO postgres;

--
-- Name: detection_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detection_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detection_events_id_seq OWNER TO postgres;

--
-- Name: detection_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detection_events_id_seq OWNED BY public.detection_events.id;


--
-- Name: drawer_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drawer_sessions (
    id integer NOT NULL,
    drawer_id integer NOT NULL,
    user_uid character varying NOT NULL,
    started_at timestamp without time zone NOT NULL,
    closed_at timestamp without time zone,
    status character varying,
    close_attempt_count integer,
    baseline_snapshot_id integer
);


ALTER TABLE public.drawer_sessions OWNER TO postgres;

--
-- Name: drawer_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drawer_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drawer_sessions_id_seq OWNER TO postgres;

--
-- Name: drawer_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drawer_sessions_id_seq OWNED BY public.drawer_sessions.id;


--
-- Name: drawer_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drawer_slots (
    id integer NOT NULL,
    drawer_id integer NOT NULL,
    slot_code character varying NOT NULL,
    row_index integer NOT NULL,
    col_index integer NOT NULL,
    polygon_json text,
    is_tracked boolean,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.drawer_slots OWNER TO postgres;

--
-- Name: drawer_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drawer_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drawer_slots_id_seq OWNER TO postgres;

--
-- Name: drawer_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drawer_slots_id_seq OWNED BY public.drawer_slots.id;


--
-- Name: drawer_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drawer_snapshots (
    id integer NOT NULL,
    drawer_id integer NOT NULL,
    session_id integer,
    snapshot_type character varying NOT NULL,
    image_url character varying NOT NULL,
    captured_at timestamp without time zone NOT NULL,
    lighting_profile character varying,
    camera_profile character varying,
    notes text
);


ALTER TABLE public.drawer_snapshots OWNER TO postgres;

--
-- Name: drawer_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drawer_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drawer_snapshots_id_seq OWNER TO postgres;

--
-- Name: drawer_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drawer_snapshots_id_seq OWNED BY public.drawer_snapshots.id;


--
-- Name: drawers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drawers (
    id integer NOT NULL,
    drawer_code character varying NOT NULL,
    cabinet_code character varying NOT NULL,
    floor integer NOT NULL,
    camera_id character varying,
    slot_rows integer NOT NULL,
    slot_cols integer NOT NULL,
    status character varying,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.drawers OWNER TO postgres;

--
-- Name: drawers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.drawers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drawers_id_seq OWNER TO postgres;

--
-- Name: drawers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.drawers_id_seq OWNED BY public.drawers.id;


--
-- Name: exception_cases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exception_cases (
    id integer NOT NULL,
    session_id integer NOT NULL,
    slot_id integer,
    detection_event_id integer,
    exception_type character varying NOT NULL,
    severity character varying,
    status character varying,
    message text,
    evidence_image_url character varying,
    resolved_by character varying,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.exception_cases OWNER TO postgres;

--
-- Name: exception_cases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exception_cases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exception_cases_id_seq OWNER TO postgres;

--
-- Name: exception_cases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exception_cases_id_seq OWNED BY public.exception_cases.id;


--
-- Name: inventory_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_events (
    id integer NOT NULL,
    session_id integer,
    user_uid character varying NOT NULL,
    event_type character varying NOT NULL,
    item_type_id integer NOT NULL,
    quantity integer NOT NULL,
    slot_id integer,
    detection_event_id integer,
    notes character varying,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.inventory_events OWNER TO postgres;

--
-- Name: inventory_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventory_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_events_id_seq OWNER TO postgres;

--
-- Name: inventory_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventory_events_id_seq OWNED BY public.inventory_events.id;


--
-- Name: item_type_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_type_images (
    id integer NOT NULL,
    item_type_id integer NOT NULL,
    image_url character varying NOT NULL,
    embedding_ref text,
    is_primary boolean,
    captured_view character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.item_type_images OWNER TO postgres;

--
-- Name: item_type_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.item_type_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_type_images_id_seq OWNER TO postgres;

--
-- Name: item_type_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.item_type_images_id_seq OWNED BY public.item_type_images.id;


--
-- Name: item_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_types (
    id integer NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    category character varying,
    description text,
    tracking_mode character varying,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.item_types OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.item_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.item_types_id_seq OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.item_types_id_seq OWNED BY public.item_types.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    uid character varying NOT NULL,
    name character varying NOT NULL,
    description character varying,
    category character varying,
    quantity integer,
    available boolean,
    location character varying,
    image_url character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans (
    id integer NOT NULL,
    user_uid character varying NOT NULL,
    item_uid character varying NOT NULL,
    borrowed_at timestamp without time zone NOT NULL,
    due_at timestamp without time zone NOT NULL,
    returned_at timestamp without time zone,
    status character varying,
    item_type_id integer,
    quantity integer DEFAULT 1,
    slot_id integer,
    source_action character varying DEFAULT 'borrow'::character varying
);


ALTER TABLE public.loans OWNER TO postgres;

--
-- Name: loans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loans_id_seq OWNER TO postgres;

--
-- Name: loans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loans_id_seq OWNED BY public.loans.id;


--
-- Name: slot_occupancies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.slot_occupancies (
    id integer NOT NULL,
    slot_id integer NOT NULL,
    snapshot_id integer,
    state character varying NOT NULL,
    item_type_id integer,
    confidence double precision,
    updated_at timestamp without time zone
);


ALTER TABLE public.slot_occupancies OWNER TO postgres;

--
-- Name: slot_occupancies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.slot_occupancies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.slot_occupancies_id_seq OWNER TO postgres;

--
-- Name: slot_occupancies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.slot_occupancies_id_seq OWNED BY public.slot_occupancies.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_uid character varying NOT NULL,
    item_uid character varying NOT NULL,
    action character varying,
    "timestamp" timestamp without time zone,
    notes character varying,
    item_type_id integer,
    quantity integer DEFAULT 1,
    slot_id integer,
    session_id integer,
    detection_event_id integer
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uid character varying NOT NULL,
    name character varying NOT NULL,
    email character varying,
    role character varying,
    password_hash character varying,
    authorized boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: access_sessions; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.access_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    unit_id integer NOT NULL,
    opened_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp without time zone,
    status character varying(50) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.access_sessions OWNER TO postgres;

--
-- Name: access_sessions_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.access_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.access_sessions_id_seq OWNER TO postgres;

--
-- Name: access_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.access_sessions_id_seq OWNED BY v2.access_sessions.id;


--
-- Name: audit_logs; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.audit_logs (
    id integer NOT NULL,
    ts timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actor_type character varying(50) NOT NULL,
    actor_id character varying(255),
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id character varying(255),
    result character varying(50),
    ip_address character varying(45),
    message text,
    correlation_id character varying(255)
);


ALTER TABLE v2.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.audit_logs_id_seq OWNED BY v2.audit_logs.id;


--
-- Name: inventory_events; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.inventory_events (
    id integer NOT NULL,
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    item_type_id integer NOT NULL,
    event_type character varying(50) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    location_id integer,
    observation_id integer,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.inventory_events OWNER TO postgres;

--
-- Name: inventory_events_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.inventory_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.inventory_events_id_seq OWNER TO postgres;

--
-- Name: inventory_events_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.inventory_events_id_seq OWNED BY v2.inventory_events.id;


--
-- Name: item_type_images; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.item_type_images (
    id integer NOT NULL,
    item_type_id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.item_type_images OWNER TO postgres;

--
-- Name: item_type_images_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.item_type_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.item_type_images_id_seq OWNER TO postgres;

--
-- Name: item_type_images_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.item_type_images_id_seq OWNED BY v2.item_type_images.id;


--
-- Name: item_types; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.item_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.item_types OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.item_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.item_types_id_seq OWNER TO postgres;

--
-- Name: item_types_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.item_types_id_seq OWNED BY v2.item_types.id;


--
-- Name: observations; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.observations (
    id integer NOT NULL,
    session_id integer NOT NULL,
    location_id integer,
    source_type character varying(50) NOT NULL,
    change_type character varying(50) NOT NULL,
    confidence double precision,
    review_status character varying(50) DEFAULT 'normal'::character varying,
    review_note text,
    observed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_vision_needs_location CHECK ((((source_type)::text <> 'vision'::text) OR (location_id IS NOT NULL))),
    CONSTRAINT observations_confidence_check CHECK (((confidence IS NULL) OR ((confidence >= (0.0)::double precision) AND (confidence <= (1.0)::double precision))))
);


ALTER TABLE v2.observations OWNER TO postgres;

--
-- Name: observations_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.observations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.observations_id_seq OWNER TO postgres;

--
-- Name: observations_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.observations_id_seq OWNED BY v2.observations.id;


--
-- Name: rfid_observation_details; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.rfid_observation_details (
    observation_id integer NOT NULL,
    tag_uid character varying(255) NOT NULL,
    reader_id character varying(255),
    rssi integer,
    read_count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_rfid_detail_valid CHECK ((tag_uid IS NOT NULL))
);


ALTER TABLE v2.rfid_observation_details OWNER TO postgres;

--
-- Name: slot_occupancies; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.slot_occupancies (
    location_id integer NOT NULL,
    state character varying(50) DEFAULT 'unknown'::character varying,
    item_type_id integer,
    confidence double precision,
    last_event_id integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slot_occupancies_confidence_check CHECK (((confidence IS NULL) OR ((confidence >= (0.0)::double precision) AND (confidence <= (1.0)::double precision))))
);


ALTER TABLE v2.slot_occupancies OWNER TO postgres;

--
-- Name: storage_locations; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.storage_locations (
    id integer NOT NULL,
    unit_id integer NOT NULL,
    level_no integer NOT NULL,
    row_no integer,
    col_no integer,
    zone_code character varying(50),
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.storage_locations OWNER TO postgres;

--
-- Name: storage_locations_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.storage_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.storage_locations_id_seq OWNER TO postgres;

--
-- Name: storage_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.storage_locations_id_seq OWNED BY v2.storage_locations.id;


--
-- Name: storage_units; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.storage_units (
    id integer NOT NULL,
    unit_type character varying(50) NOT NULL,
    layout_type character varying(50) NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.storage_units OWNER TO postgres;

--
-- Name: storage_units_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.storage_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.storage_units_id_seq OWNER TO postgres;

--
-- Name: storage_units_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.storage_units_id_seq OWNED BY v2.storage_units.id;


--
-- Name: users; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.users (
    id integer NOT NULL,
    nfc_card_uid character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: v2; Owner: postgres
--

CREATE SEQUENCE v2.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE v2.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: v2; Owner: postgres
--

ALTER SEQUENCE v2.users_id_seq OWNED BY v2.users.id;


--
-- Name: vision_observation_details; Type: TABLE; Schema: v2; Owner: postgres
--

CREATE TABLE v2.vision_observation_details (
    observation_id integer NOT NULL,
    before_image_url character varying(500),
    after_image_url character varying(500),
    crop_url character varying(500),
    model_version character varying(100),
    raw_predictions_json jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE v2.vision_observation_details OWNER TO postgres;

--
-- Name: approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approvals ALTER COLUMN id SET DEFAULT nextval('public.approvals_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: compartments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compartments ALTER COLUMN id SET DEFAULT nextval('public.compartments_id_seq'::regclass);


--
-- Name: detection_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events ALTER COLUMN id SET DEFAULT nextval('public.detection_events_id_seq'::regclass);


--
-- Name: drawer_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_sessions ALTER COLUMN id SET DEFAULT nextval('public.drawer_sessions_id_seq'::regclass);


--
-- Name: drawer_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_slots ALTER COLUMN id SET DEFAULT nextval('public.drawer_slots_id_seq'::regclass);


--
-- Name: drawer_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_snapshots ALTER COLUMN id SET DEFAULT nextval('public.drawer_snapshots_id_seq'::regclass);


--
-- Name: drawers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawers ALTER COLUMN id SET DEFAULT nextval('public.drawers_id_seq'::regclass);


--
-- Name: exception_cases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exception_cases ALTER COLUMN id SET DEFAULT nextval('public.exception_cases_id_seq'::regclass);


--
-- Name: inventory_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events ALTER COLUMN id SET DEFAULT nextval('public.inventory_events_id_seq'::regclass);


--
-- Name: item_type_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_type_images ALTER COLUMN id SET DEFAULT nextval('public.item_type_images_id_seq'::regclass);


--
-- Name: item_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_types ALTER COLUMN id SET DEFAULT nextval('public.item_types_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: loans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans ALTER COLUMN id SET DEFAULT nextval('public.loans_id_seq'::regclass);


--
-- Name: slot_occupancies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_occupancies ALTER COLUMN id SET DEFAULT nextval('public.slot_occupancies_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: access_sessions id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.access_sessions ALTER COLUMN id SET DEFAULT nextval('v2.access_sessions_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.audit_logs ALTER COLUMN id SET DEFAULT nextval('v2.audit_logs_id_seq'::regclass);


--
-- Name: inventory_events id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events ALTER COLUMN id SET DEFAULT nextval('v2.inventory_events_id_seq'::regclass);


--
-- Name: item_type_images id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.item_type_images ALTER COLUMN id SET DEFAULT nextval('v2.item_type_images_id_seq'::regclass);


--
-- Name: item_types id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.item_types ALTER COLUMN id SET DEFAULT nextval('v2.item_types_id_seq'::regclass);


--
-- Name: observations id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.observations ALTER COLUMN id SET DEFAULT nextval('v2.observations_id_seq'::regclass);


--
-- Name: storage_locations id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.storage_locations ALTER COLUMN id SET DEFAULT nextval('v2.storage_locations_id_seq'::regclass);


--
-- Name: storage_units id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.storage_units ALTER COLUMN id SET DEFAULT nextval('v2.storage_units_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.users ALTER COLUMN id SET DEFAULT nextval('v2.users_id_seq'::regclass);


--
-- Data for Name: approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approvals (id, user_uid, item_uid, requested_at, status, priority, reason, duration_days, admin_uid, resolved_at, admin_notes) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "timestamp", type, "user", item, status, message, ip_address) FROM stdin;
1	2026-03-11 02:12:40.68062	unlock	NFC001	RFID001	success	Cabinet A1-001 unlocked successfully	\N
2	2026-03-10 23:12:40.68062	scan	NFC002	RFID002	success	Item scanned for checkout	\N
3	2026-03-10 20:12:40.68062	lock	NFC001	\N	success	Cabinet A1-001 locked	\N
4	2026-03-10 01:12:40.68062	unlock	NFC003	RFID003	success	Cabinet B2-015 unlocked	\N
5	2026-03-09 18:12:40.68062	scan	NFC002	RFID001	success	Item RFID verified	\N
6	2026-03-10 16:12:40.68062	unlock	NFC999	\N	failed	Unauthorized user attempted access	\N
7	2026-03-09 00:12:40.68062	unlock	NFC001	RFID001	success	Cabinet opened for item borrowing	\N
8	2026-03-11 02:15:06.365721	unlock	NFC001	RFID001	success	Cabinet A1-001 unlocked successfully	\N
9	2026-03-10 23:15:06.365721	scan	NFC002	RFID002	success	Item scanned for checkout	\N
10	2026-03-10 20:15:06.365721	lock	NFC001	\N	success	Cabinet A1-001 locked	\N
11	2026-03-10 01:15:06.365721	unlock	NFC003	RFID003	success	Cabinet B2-015 unlocked	\N
12	2026-03-09 18:15:06.365721	scan	NFC002	RFID001	success	Item RFID verified	\N
13	2026-03-10 16:15:06.365721	unlock	NFC999	\N	failed	Unauthorized user attempted access	\N
14	2026-03-09 00:15:06.365721	unlock	NFC001	RFID001	success	Cabinet opened for item borrowing	\N
\.


--
-- Data for Name: compartments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compartments (id, floor, locker_number, status, item_uid, user_uid, occupied_at, due_at) FROM stdin;
\.


--
-- Data for Name: detection_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detection_events (id, session_id, slot_id, before_snapshot_id, after_snapshot_id, change_type, predicted_item_type_id, similarity_score, mask_area, crop_image_url, raw_predictions, detected_at) FROM stdin;
\.


--
-- Data for Name: drawer_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drawer_sessions (id, drawer_id, user_uid, started_at, closed_at, status, close_attempt_count, baseline_snapshot_id) FROM stdin;
\.


--
-- Data for Name: drawer_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drawer_slots (id, drawer_id, slot_code, row_index, col_index, polygon_json, is_tracked, is_active, created_at) FROM stdin;
1	1	CAB-A-D1-A1	0	0	[[4, 4], [103, 4], [103, 116], [4, 116]]	t	t	2026-03-11 04:06:02.138975
2	1	CAB-A-D1-A2	0	1	[[111, 4], [209, 4], [209, 116], [111, 116]]	t	t	2026-03-11 04:06:02.138975
3	1	CAB-A-D1-A3	0	2	[[217, 4], [316, 4], [316, 116], [217, 116]]	t	t	2026-03-11 04:06:02.138975
4	1	CAB-A-D1-A4	0	3	[[324, 4], [423, 4], [423, 116], [324, 116]]	t	t	2026-03-11 04:06:02.138975
5	1	CAB-A-D1-A5	0	4	[[431, 4], [529, 4], [529, 116], [431, 116]]	t	t	2026-03-11 04:06:02.138975
6	1	CAB-A-D1-A6	0	5	[[537, 4], [636, 4], [636, 116], [537, 116]]	f	t	2026-03-11 04:06:02.138975
7	1	CAB-A-D1-B1	1	0	[[4, 124], [103, 124], [103, 236], [4, 236]]	t	t	2026-03-11 04:06:02.138975
8	1	CAB-A-D1-B2	1	1	[[111, 124], [209, 124], [209, 236], [111, 236]]	t	t	2026-03-11 04:06:02.138975
9	1	CAB-A-D1-B3	1	2	[[217, 124], [316, 124], [316, 236], [217, 236]]	t	t	2026-03-11 04:06:02.138975
10	1	CAB-A-D1-B4	1	3	[[324, 124], [423, 124], [423, 236], [324, 236]]	t	t	2026-03-11 04:06:02.138975
11	1	CAB-A-D1-B5	1	4	[[431, 124], [529, 124], [529, 236], [431, 236]]	t	t	2026-03-11 04:06:02.138975
12	1	CAB-A-D1-B6	1	5	[[537, 124], [636, 124], [636, 236], [537, 236]]	f	t	2026-03-11 04:06:02.138975
13	1	CAB-A-D1-C1	2	0	[[4, 244], [103, 244], [103, 356], [4, 356]]	t	t	2026-03-11 04:06:02.138975
14	1	CAB-A-D1-C2	2	1	[[111, 244], [209, 244], [209, 356], [111, 356]]	t	t	2026-03-11 04:06:02.138975
15	1	CAB-A-D1-C3	2	2	[[217, 244], [316, 244], [316, 356], [217, 356]]	t	t	2026-03-11 04:06:02.138975
16	1	CAB-A-D1-C4	2	3	[[324, 244], [423, 244], [423, 356], [324, 356]]	t	t	2026-03-11 04:06:02.138975
17	1	CAB-A-D1-C5	2	4	[[431, 244], [529, 244], [529, 356], [431, 356]]	t	t	2026-03-11 04:06:02.138975
18	1	CAB-A-D1-C6	2	5	[[537, 244], [636, 244], [636, 356], [537, 356]]	f	t	2026-03-11 04:06:02.138975
19	1	CAB-A-D1-D1	3	0	[[4, 364], [103, 364], [103, 476], [4, 476]]	t	t	2026-03-11 04:06:02.138975
20	1	CAB-A-D1-D2	3	1	[[111, 364], [209, 364], [209, 476], [111, 476]]	t	t	2026-03-11 04:06:02.138975
21	1	CAB-A-D1-D3	3	2	[[217, 364], [316, 364], [316, 476], [217, 476]]	t	t	2026-03-11 04:06:02.138975
22	1	CAB-A-D1-D4	3	3	[[324, 364], [423, 364], [423, 476], [324, 476]]	t	t	2026-03-11 04:06:02.138975
23	1	CAB-A-D1-D5	3	4	[[431, 364], [529, 364], [529, 476], [431, 476]]	t	t	2026-03-11 04:06:02.138975
24	1	CAB-A-D1-D6	3	5	[[537, 364], [636, 364], [636, 476], [537, 476]]	f	t	2026-03-11 04:06:02.138975
25	2	CAB-B-D1-A1	0	0	[[4, 4], [103, 4], [103, 116], [4, 116]]	t	t	2026-03-11 04:06:03.977901
26	2	CAB-B-D1-A2	0	1	[[111, 4], [209, 4], [209, 116], [111, 116]]	t	t	2026-03-11 04:06:03.977901
27	2	CAB-B-D1-A3	0	2	[[217, 4], [316, 4], [316, 116], [217, 116]]	t	t	2026-03-11 04:06:03.977901
28	2	CAB-B-D1-A4	0	3	[[324, 4], [423, 4], [423, 116], [324, 116]]	t	t	2026-03-11 04:06:03.977901
29	2	CAB-B-D1-A5	0	4	[[431, 4], [529, 4], [529, 116], [431, 116]]	t	t	2026-03-11 04:06:03.977901
30	2	CAB-B-D1-A6	0	5	[[537, 4], [636, 4], [636, 116], [537, 116]]	f	t	2026-03-11 04:06:03.977901
31	2	CAB-B-D1-B1	1	0	[[4, 124], [103, 124], [103, 236], [4, 236]]	t	t	2026-03-11 04:06:03.977901
32	2	CAB-B-D1-B2	1	1	[[111, 124], [209, 124], [209, 236], [111, 236]]	t	t	2026-03-11 04:06:03.977901
33	2	CAB-B-D1-B3	1	2	[[217, 124], [316, 124], [316, 236], [217, 236]]	t	t	2026-03-11 04:06:03.977901
34	2	CAB-B-D1-B4	1	3	[[324, 124], [423, 124], [423, 236], [324, 236]]	t	t	2026-03-11 04:06:03.977901
35	2	CAB-B-D1-B5	1	4	[[431, 124], [529, 124], [529, 236], [431, 236]]	t	t	2026-03-11 04:06:03.977901
36	2	CAB-B-D1-B6	1	5	[[537, 124], [636, 124], [636, 236], [537, 236]]	f	t	2026-03-11 04:06:03.977901
37	2	CAB-B-D1-C1	2	0	[[4, 244], [103, 244], [103, 356], [4, 356]]	t	t	2026-03-11 04:06:03.977901
38	2	CAB-B-D1-C2	2	1	[[111, 244], [209, 244], [209, 356], [111, 356]]	t	t	2026-03-11 04:06:03.977901
39	2	CAB-B-D1-C3	2	2	[[217, 244], [316, 244], [316, 356], [217, 356]]	t	t	2026-03-11 04:06:03.977901
40	2	CAB-B-D1-C4	2	3	[[324, 244], [423, 244], [423, 356], [324, 356]]	t	t	2026-03-11 04:06:03.977901
41	2	CAB-B-D1-C5	2	4	[[431, 244], [529, 244], [529, 356], [431, 356]]	t	t	2026-03-11 04:06:03.977901
42	2	CAB-B-D1-C6	2	5	[[537, 244], [636, 244], [636, 356], [537, 356]]	f	t	2026-03-11 04:06:03.977901
43	2	CAB-B-D1-D1	3	0	[[4, 364], [103, 364], [103, 476], [4, 476]]	t	t	2026-03-11 04:06:03.977901
44	2	CAB-B-D1-D2	3	1	[[111, 364], [209, 364], [209, 476], [111, 476]]	t	t	2026-03-11 04:06:03.977901
45	2	CAB-B-D1-D3	3	2	[[217, 364], [316, 364], [316, 476], [217, 476]]	t	t	2026-03-11 04:06:03.977901
46	2	CAB-B-D1-D4	3	3	[[324, 364], [423, 364], [423, 476], [324, 476]]	t	t	2026-03-11 04:06:03.977901
47	2	CAB-B-D1-D5	3	4	[[431, 364], [529, 364], [529, 476], [431, 476]]	t	t	2026-03-11 04:06:03.977901
48	2	CAB-B-D1-D6	3	5	[[537, 364], [636, 364], [636, 476], [537, 476]]	f	t	2026-03-11 04:06:03.977901
49	3	CAB-C-D1-A1	0	0	[[4, 4], [156, 4], [156, 156], [4, 156]]	t	t	2026-03-11 04:06:04.773254
50	3	CAB-C-D1-A2	0	1	[[164, 4], [316, 4], [316, 156], [164, 156]]	t	t	2026-03-11 04:06:04.773254
51	3	CAB-C-D1-A3	0	2	[[324, 4], [476, 4], [476, 156], [324, 156]]	t	t	2026-03-11 04:06:04.773254
52	3	CAB-C-D1-A4	0	3	[[484, 4], [636, 4], [636, 156], [484, 156]]	f	t	2026-03-11 04:06:04.773254
53	3	CAB-C-D1-B1	1	0	[[4, 164], [156, 164], [156, 316], [4, 316]]	t	t	2026-03-11 04:06:04.773254
54	3	CAB-C-D1-B2	1	1	[[164, 164], [316, 164], [316, 316], [164, 316]]	t	t	2026-03-11 04:06:04.773254
55	3	CAB-C-D1-B3	1	2	[[324, 164], [476, 164], [476, 316], [324, 316]]	t	t	2026-03-11 04:06:04.773254
56	3	CAB-C-D1-B4	1	3	[[484, 164], [636, 164], [636, 316], [484, 316]]	f	t	2026-03-11 04:06:04.773254
57	3	CAB-C-D1-C1	2	0	[[4, 324], [156, 324], [156, 476], [4, 476]]	t	t	2026-03-11 04:06:04.773254
58	3	CAB-C-D1-C2	2	1	[[164, 324], [316, 324], [316, 476], [164, 476]]	t	t	2026-03-11 04:06:04.773254
59	3	CAB-C-D1-C3	2	2	[[324, 324], [476, 324], [476, 476], [324, 476]]	t	t	2026-03-11 04:06:04.773254
60	3	CAB-C-D1-C4	2	3	[[484, 324], [636, 324], [636, 476], [484, 476]]	f	t	2026-03-11 04:06:04.773254
\.


--
-- Data for Name: drawer_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drawer_snapshots (id, drawer_id, session_id, snapshot_type, image_url, captured_at, lighting_profile, camera_profile, notes) FROM stdin;
\.


--
-- Data for Name: drawers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drawers (id, drawer_code, cabinet_code, floor, camera_id, slot_rows, slot_cols, status, is_active, created_at, updated_at) FROM stdin;
1	CAB-A-D1	CAB-A	1	cam_cab_a_d1	4	6	active	t	2026-03-11 04:06:00.326654	2026-03-11 04:06:00.326654
2	CAB-B-D1	CAB-B	1	cam_cab_b_d1	4	6	active	t	2026-03-11 04:06:02.072385	2026-03-11 04:06:02.072385
3	CAB-C-D1	CAB-C	1	cam_cab_c_d1	3	4	active	t	2026-03-11 04:06:03.912249	2026-03-11 04:06:03.912249
\.


--
-- Data for Name: exception_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exception_cases (id, session_id, slot_id, detection_event_id, exception_type, severity, status, message, evidence_image_url, resolved_by, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_events (id, session_id, user_uid, event_type, item_type_id, quantity, slot_id, detection_event_id, notes, created_at) FROM stdin;
\.


--
-- Data for Name: item_type_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_type_images (id, item_type_id, image_url, embedding_ref, is_primary, captured_view, created_at) FROM stdin;
\.


--
-- Data for Name: item_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_types (id, code, name, category, description, tracking_mode, is_active, created_at, updated_at) FROM stdin;
1	ESP32_DEVKIT_V1	ESP32 DevKit V1	Microcontroller	Dual-core 240MHz, Wi-Fi + Bluetooth, 38-pin DevKit board	loose	t	2026-03-11 04:05:56.69212	2026-03-11 04:05:56.69212
2	ESP8266_NODEMCU_V3	NodeMCU V3 (ESP8266)	Microcontroller	ESP8266 Wi-Fi SoC on Lolin V3 breakout, 30-pin	loose	t	2026-03-11 04:05:56.836303	2026-03-11 04:05:56.836303
3	ARDUINO_NANO_328P	Arduino Nano (ATmega328P)	Microcontroller	ATmega328P, 5V, 16MHz, Mini-USB, 30-pin	loose	t	2026-03-11 04:05:56.943745	2026-03-11 04:05:56.943745
4	ARDUINO_UNO_R3	Arduino Uno R3	Microcontroller	ATmega328P, 5V, 16MHz, USB-B, 28-pin	loose	t	2026-03-11 04:05:57.078396	2026-03-11 04:05:57.078396
5	ARDUINO_MEGA_2560	Arduino Mega 2560	Microcontroller	ATmega2560, 5V, 16MHz, 54 digital I/O pins	loose	t	2026-03-11 04:05:57.196923	2026-03-11 04:05:57.196923
6	RASPBERRY_PI_PICO	Raspberry Pi Pico	Microcontroller	RP2040, dual-core Cortex-M0+, 264KB SRAM, 2MB Flash	loose	t	2026-03-11 04:05:57.325557	2026-03-11 04:05:57.325557
7	STM32_F103C8	STM32 Blue Pill (F103C8T6)	Microcontroller	ARM Cortex-M3, 72MHz, 20KB SRAM, 64KB Flash	loose	t	2026-03-11 04:05:57.451804	2026-03-11 04:05:57.451804
8	DHT22	DHT22 Temperature & Humidity	Sensor	±0.5°C accuracy, 0–100% RH, single-wire protocol	loose	t	2026-03-11 04:05:57.596535	2026-03-11 04:05:57.596535
9	HCSR04	HC-SR04 Ultrasonic Distance	Sensor	2–400cm range, 4-pin, 5V, ~3ms cycle time	loose	t	2026-03-11 04:05:57.739013	2026-03-11 04:05:57.739013
10	PIR_HC_SR501	PIR Motion Sensor HC-SR501	Sensor	Adjustable sensitivity and delay, 3.3–5V, wide lens	loose	t	2026-03-11 04:05:57.855424	2026-03-11 04:05:57.855424
11	BMP280	BMP280 Pressure & Temperature	Sensor	I2C/SPI, ±1 hPa, ±1°C, 3.3V breakout	loose	t	2026-03-11 04:05:57.98983	2026-03-11 04:05:57.98983
12	MPU6050	MPU-6050 Gyro & Accelerometer	Sensor	6-axis IMU, I2C, 3.3–5V breakout	loose	t	2026-03-11 04:05:58.114883	2026-03-11 04:05:58.114883
13	OLED_096_I2C	0.96" OLED Display (I2C)	Display	SSD1306, 128×64px, 3.3–5V, 4-pin I2C	loose	t	2026-03-11 04:05:58.225365	2026-03-11 04:05:58.225365
14	LCD_1602_I2C	16×2 LCD Display (I2C)	Display	HD44780 + PCF8574 I2C backpack, 5V, adjustable contrast	loose	t	2026-03-11 04:05:58.370532	2026-03-11 04:05:58.370532
15	HC05_BLUETOOTH	HC-05 Bluetooth Module	Communication	Classic Bluetooth 2.0, UART, master/slave configurable	loose	t	2026-03-11 04:05:58.491105	2026-03-11 04:05:58.491105
16	NRF24L01	NRF24L01 2.4GHz Radio	Communication	SPI, 250kbps–2Mbps, 3.3V, up to 100m range	loose	t	2026-03-11 04:05:58.635593	2026-03-11 04:05:58.635593
17	SIM800L	SIM800L GSM/GPRS Module	Communication	Quad-band GSM, micro-SIM, UART, 3.4–4.4V	loose	t	2026-03-11 04:05:58.747168	2026-03-11 04:05:58.747168
18	SERVO_SG90	Servo Motor SG90	Actuator	9g micro servo, 0–180°, PWM 50Hz, 5V	loose	t	2026-03-11 04:05:58.88697	2026-03-11 04:05:58.88697
19	L298N_DRIVER	L298N Dual H-Bridge Motor Driver	Actuator	2-channel, 2A peak, 5–35V motor supply	loose	t	2026-03-11 04:05:59.009591	2026-03-11 04:05:59.009591
20	RELAY_5V_MODULE	5V Relay Module	Actuator	Single channel, optocoupler isolated, 10A/250VAC max	loose	t	2026-03-11 04:05:59.169682	2026-03-11 04:05:59.169682
21	TP4056_MODULE	TP4056 Li-Ion Charger Module	Power	1A charge current, micro-USB input, over-discharge protection	loose	t	2026-03-11 04:05:59.287538	2026-03-11 04:05:59.287538
22	LM7805_REG	LM7805 Voltage Regulator (TO-220)	Power	5V linear regulator, 1.5A max, TO-220 package	loose	t	2026-03-11 04:05:59.415854	2026-03-11 04:05:59.415854
23	JUMPER_WIRE_PACK	Jumper Wire Pack (120 pcs)	Consumable	M-M / M-F / F-F assorted 20cm jumper wires	bulk	t	2026-03-11 04:05:59.547278	2026-03-11 04:05:59.547278
24	RESISTOR_KIT	Resistor Kit (600 pcs)	Consumable	1Ω–1MΩ, 30 values × 20 pcs, 1/4W 5%	bulk	t	2026-03-11 04:05:59.674518	2026-03-11 04:05:59.674518
25	CAPACITOR_KIT	Ceramic Capacitor Kit (300 pcs)	Consumable	10pF–100nF, 10 values × 30 pcs, 50V	bulk	t	2026-03-11 04:05:59.834856	2026-03-11 04:05:59.834856
26	LED_KIT_ASSORTED	LED Kit Assorted (100 pcs)	Consumable	5mm LED, Red/Green/Blue/Yellow/White, 20 pcs each	bulk	t	2026-03-11 04:05:59.949823	2026-03-11 04:05:59.949823
27	BREADBOARD_MB102	Breadboard MB-102 (830 pts)	Breadboard	Full-size solderless breadboard, 2 power rails	loose	t	2026-03-11 04:06:00.067885	2026-03-11 04:06:00.067885
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, uid, name, description, category, quantity, available, location, image_url, created_at, updated_at) FROM stdin;
1	RFID001	Arduino Uno Kit	\N	Electronics	1	f	A1-001	\N	2026-03-11 04:12:40.478954	2026-03-11 04:12:40.478954
2	RFID002	Raspberry Pi 4	\N	Electronics	1	f	A1-002	\N	2026-03-11 04:12:40.478954	2026-03-11 04:12:40.478954
3	RFID003	Digital Multimeter	\N	Tools	1	t	B2-015	\N	2026-03-11 04:12:40.478954	2026-03-11 04:12:40.478954
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loans (id, user_uid, item_uid, borrowed_at, due_at, returned_at, status, item_type_id, quantity, slot_id, source_action) FROM stdin;
1	NFC001	RFID001	2026-03-09 04:12:40.68062	2026-03-16 04:12:40.68062	\N	active	\N	1	\N	borrow
2	NFC002	RFID002	2026-03-01 04:12:40.68062	2026-03-08 04:12:40.68062	\N	overdue	\N	1	\N	borrow
3	NFC003	RFID003	2026-02-19 04:12:40.68062	2026-02-26 04:12:40.68062	2026-02-24 04:12:40.68062	returned	\N	1	\N	borrow
4	NFC001	RFID003	2026-02-09 04:12:40.68062	2026-02-16 04:12:40.68062	2026-02-14 04:12:40.68062	returned	\N	1	\N	borrow
5	NFC001	RFID001	2026-03-09 04:15:06.365721	2026-03-16 04:15:06.365721	\N	active	\N	1	\N	borrow
6	NFC002	RFID002	2026-03-01 04:15:06.365721	2026-03-08 04:15:06.365721	\N	overdue	\N	1	\N	borrow
7	NFC003	RFID003	2026-02-19 04:15:06.365721	2026-02-26 04:15:06.365721	2026-02-24 04:15:06.365721	returned	\N	1	\N	borrow
8	NFC001	RFID003	2026-02-09 04:15:06.365721	2026-02-16 04:15:06.365721	2026-02-14 04:15:06.365721	returned	\N	1	\N	borrow
\.


--
-- Data for Name: slot_occupancies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.slot_occupancies (id, slot_id, snapshot_id, state, item_type_id, confidence, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_uid, item_uid, action, "timestamp", notes, item_type_id, quantity, slot_id, session_id, detection_event_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, uid, name, email, role, password_hash, authorized, created_at, updated_at) FROM stdin;
1	NFC001	Alice Johnson	alice@example.com	user	\N	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
2	NFC002	Bob Smith	bob@example.com	user	\N	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
3	NFC003	Charlie Brown	charlie@example.com	user	\N	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
\.


--
-- Data for Name: access_sessions; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.access_sessions (id, user_id, unit_id, opened_at, closed_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.audit_logs (id, ts, actor_type, actor_id, action, target_type, target_id, result, ip_address, message, correlation_id) FROM stdin;
1	2026-03-11 02:12:40.68062	user	NFC001	unlock	item	RFID001	success	\N	Cabinet A1-001 unlocked successfully	\N
2	2026-03-10 23:12:40.68062	user	NFC002	scan	item	RFID002	success	\N	Item scanned for checkout	\N
3	2026-03-10 20:12:40.68062	user	NFC001	lock	\N	\N	success	\N	Cabinet A1-001 locked	\N
4	2026-03-10 01:12:40.68062	user	NFC003	unlock	item	RFID003	success	\N	Cabinet B2-015 unlocked	\N
5	2026-03-09 18:12:40.68062	user	NFC002	scan	item	RFID001	success	\N	Item RFID verified	\N
6	2026-03-10 16:12:40.68062	user	NFC999	unlock	\N	\N	failed	\N	Unauthorized user attempted access	\N
7	2026-03-09 00:12:40.68062	user	NFC001	unlock	item	RFID001	success	\N	Cabinet opened for item borrowing	\N
8	2026-03-11 02:15:06.365721	user	NFC001	unlock	item	RFID001	success	\N	Cabinet A1-001 unlocked successfully	\N
9	2026-03-10 23:15:06.365721	user	NFC002	scan	item	RFID002	success	\N	Item scanned for checkout	\N
10	2026-03-10 20:15:06.365721	user	NFC001	lock	\N	\N	success	\N	Cabinet A1-001 locked	\N
11	2026-03-10 01:15:06.365721	user	NFC003	unlock	item	RFID003	success	\N	Cabinet B2-015 unlocked	\N
12	2026-03-09 18:15:06.365721	user	NFC002	scan	item	RFID001	success	\N	Item RFID verified	\N
13	2026-03-10 16:15:06.365721	user	NFC999	unlock	\N	\N	failed	\N	Unauthorized user attempted access	\N
14	2026-03-09 00:15:06.365721	user	NFC001	unlock	item	RFID001	success	\N	Cabinet opened for item borrowing	\N
\.


--
-- Data for Name: inventory_events; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.inventory_events (id, session_id, user_id, item_type_id, event_type, quantity, location_id, observation_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: item_type_images; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.item_type_images (id, item_type_id, image_url, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: item_types; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.item_types (id, name, active, created_at, updated_at) FROM stdin;
1	ESP32 DevKit V1	t	2026-03-11 04:05:56.69212	2026-03-11 04:05:56.69212
2	NodeMCU V3 (ESP8266)	t	2026-03-11 04:05:56.836303	2026-03-11 04:05:56.836303
3	Arduino Nano (ATmega328P)	t	2026-03-11 04:05:56.943745	2026-03-11 04:05:56.943745
4	Arduino Uno R3	t	2026-03-11 04:05:57.078396	2026-03-11 04:05:57.078396
5	Arduino Mega 2560	t	2026-03-11 04:05:57.196923	2026-03-11 04:05:57.196923
6	Raspberry Pi Pico	t	2026-03-11 04:05:57.325557	2026-03-11 04:05:57.325557
7	STM32 Blue Pill (F103C8T6)	t	2026-03-11 04:05:57.451804	2026-03-11 04:05:57.451804
8	DHT22 Temperature & Humidity	t	2026-03-11 04:05:57.596535	2026-03-11 04:05:57.596535
9	HC-SR04 Ultrasonic Distance	t	2026-03-11 04:05:57.739013	2026-03-11 04:05:57.739013
10	PIR Motion Sensor HC-SR501	t	2026-03-11 04:05:57.855424	2026-03-11 04:05:57.855424
11	BMP280 Pressure & Temperature	t	2026-03-11 04:05:57.98983	2026-03-11 04:05:57.98983
12	MPU-6050 Gyro & Accelerometer	t	2026-03-11 04:05:58.114883	2026-03-11 04:05:58.114883
13	0.96" OLED Display (I2C)	t	2026-03-11 04:05:58.225365	2026-03-11 04:05:58.225365
14	16×2 LCD Display (I2C)	t	2026-03-11 04:05:58.370532	2026-03-11 04:05:58.370532
15	HC-05 Bluetooth Module	t	2026-03-11 04:05:58.491105	2026-03-11 04:05:58.491105
16	NRF24L01 2.4GHz Radio	t	2026-03-11 04:05:58.635593	2026-03-11 04:05:58.635593
17	SIM800L GSM/GPRS Module	t	2026-03-11 04:05:58.747168	2026-03-11 04:05:58.747168
18	Servo Motor SG90	t	2026-03-11 04:05:58.88697	2026-03-11 04:05:58.88697
19	L298N Dual H-Bridge Motor Driver	t	2026-03-11 04:05:59.009591	2026-03-11 04:05:59.009591
20	5V Relay Module	t	2026-03-11 04:05:59.169682	2026-03-11 04:05:59.169682
21	TP4056 Li-Ion Charger Module	t	2026-03-11 04:05:59.287538	2026-03-11 04:05:59.287538
22	LM7805 Voltage Regulator (TO-220)	t	2026-03-11 04:05:59.415854	2026-03-11 04:05:59.415854
23	Jumper Wire Pack (120 pcs)	t	2026-03-11 04:05:59.547278	2026-03-11 04:05:59.547278
24	Resistor Kit (600 pcs)	t	2026-03-11 04:05:59.674518	2026-03-11 04:05:59.674518
25	Ceramic Capacitor Kit (300 pcs)	t	2026-03-11 04:05:59.834856	2026-03-11 04:05:59.834856
26	LED Kit Assorted (100 pcs)	t	2026-03-11 04:05:59.949823	2026-03-11 04:05:59.949823
27	Breadboard MB-102 (830 pts)	t	2026-03-11 04:06:00.067885	2026-03-11 04:06:00.067885
\.


--
-- Data for Name: observations; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.observations (id, session_id, location_id, source_type, change_type, confidence, review_status, review_note, observed_at, created_at) FROM stdin;
\.


--
-- Data for Name: rfid_observation_details; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.rfid_observation_details (observation_id, tag_uid, reader_id, rssi, read_count, created_at) FROM stdin;
\.


--
-- Data for Name: slot_occupancies; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.slot_occupancies (location_id, state, item_type_id, confidence, last_event_id, updated_at) FROM stdin;
\.


--
-- Data for Name: storage_locations; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.storage_locations (id, unit_id, level_no, row_no, col_no, zone_code, active, created_at) FROM stdin;
1	1	0	0	0	\N	t	2026-03-11 04:06:02.138975
2	1	0	0	1	\N	t	2026-03-11 04:06:02.138975
3	1	0	0	2	\N	t	2026-03-11 04:06:02.138975
4	1	0	0	3	\N	t	2026-03-11 04:06:02.138975
5	1	0	0	4	\N	t	2026-03-11 04:06:02.138975
6	1	0	0	5	\N	t	2026-03-11 04:06:02.138975
7	1	0	1	0	\N	t	2026-03-11 04:06:02.138975
8	1	0	1	1	\N	t	2026-03-11 04:06:02.138975
9	1	0	1	2	\N	t	2026-03-11 04:06:02.138975
10	1	0	1	3	\N	t	2026-03-11 04:06:02.138975
11	1	0	1	4	\N	t	2026-03-11 04:06:02.138975
12	1	0	1	5	\N	t	2026-03-11 04:06:02.138975
13	1	0	2	0	\N	t	2026-03-11 04:06:02.138975
14	1	0	2	1	\N	t	2026-03-11 04:06:02.138975
15	1	0	2	2	\N	t	2026-03-11 04:06:02.138975
16	1	0	2	3	\N	t	2026-03-11 04:06:02.138975
17	1	0	2	4	\N	t	2026-03-11 04:06:02.138975
18	1	0	2	5	\N	t	2026-03-11 04:06:02.138975
19	1	0	3	0	\N	t	2026-03-11 04:06:02.138975
20	1	0	3	1	\N	t	2026-03-11 04:06:02.138975
21	1	0	3	2	\N	t	2026-03-11 04:06:02.138975
22	1	0	3	3	\N	t	2026-03-11 04:06:02.138975
23	1	0	3	4	\N	t	2026-03-11 04:06:02.138975
24	1	0	3	5	\N	t	2026-03-11 04:06:02.138975
25	2	0	0	0	\N	t	2026-03-11 04:06:03.977901
26	2	0	0	1	\N	t	2026-03-11 04:06:03.977901
27	2	0	0	2	\N	t	2026-03-11 04:06:03.977901
28	2	0	0	3	\N	t	2026-03-11 04:06:03.977901
29	2	0	0	4	\N	t	2026-03-11 04:06:03.977901
30	2	0	0	5	\N	t	2026-03-11 04:06:03.977901
31	2	0	1	0	\N	t	2026-03-11 04:06:03.977901
32	2	0	1	1	\N	t	2026-03-11 04:06:03.977901
33	2	0	1	2	\N	t	2026-03-11 04:06:03.977901
34	2	0	1	3	\N	t	2026-03-11 04:06:03.977901
35	2	0	1	4	\N	t	2026-03-11 04:06:03.977901
36	2	0	1	5	\N	t	2026-03-11 04:06:03.977901
37	2	0	2	0	\N	t	2026-03-11 04:06:03.977901
38	2	0	2	1	\N	t	2026-03-11 04:06:03.977901
39	2	0	2	2	\N	t	2026-03-11 04:06:03.977901
40	2	0	2	3	\N	t	2026-03-11 04:06:03.977901
41	2	0	2	4	\N	t	2026-03-11 04:06:03.977901
42	2	0	2	5	\N	t	2026-03-11 04:06:03.977901
43	2	0	3	0	\N	t	2026-03-11 04:06:03.977901
44	2	0	3	1	\N	t	2026-03-11 04:06:03.977901
45	2	0	3	2	\N	t	2026-03-11 04:06:03.977901
46	2	0	3	3	\N	t	2026-03-11 04:06:03.977901
47	2	0	3	4	\N	t	2026-03-11 04:06:03.977901
48	2	0	3	5	\N	t	2026-03-11 04:06:03.977901
49	3	0	0	0	\N	t	2026-03-11 04:06:04.773254
50	3	0	0	1	\N	t	2026-03-11 04:06:04.773254
51	3	0	0	2	\N	t	2026-03-11 04:06:04.773254
52	3	0	0	3	\N	t	2026-03-11 04:06:04.773254
53	3	0	1	0	\N	t	2026-03-11 04:06:04.773254
54	3	0	1	1	\N	t	2026-03-11 04:06:04.773254
55	3	0	1	2	\N	t	2026-03-11 04:06:04.773254
56	3	0	1	3	\N	t	2026-03-11 04:06:04.773254
57	3	0	2	0	\N	t	2026-03-11 04:06:04.773254
58	3	0	2	1	\N	t	2026-03-11 04:06:04.773254
59	3	0	2	2	\N	t	2026-03-11 04:06:04.773254
60	3	0	2	3	\N	t	2026-03-11 04:06:04.773254
\.


--
-- Data for Name: storage_units; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.storage_units (id, unit_type, layout_type, active, created_at, updated_at) FROM stdin;
1	drawer	grid	t	2026-03-11 04:06:00.326654	2026-03-11 04:06:00.326654
2	drawer	grid	t	2026-03-11 04:06:02.072385	2026-03-11 04:06:02.072385
3	drawer	grid	t	2026-03-11 04:06:03.912249	2026-03-11 04:06:03.912249
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.users (id, nfc_card_uid, name, role, active, created_at, updated_at) FROM stdin;
1	NFC001	Alice Johnson	user	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
2	NFC002	Bob Smith	user	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
3	NFC003	Charlie Brown	user	t	2026-03-11 04:12:40.35022	2026-03-11 04:12:40.35022
\.


--
-- Data for Name: vision_observation_details; Type: TABLE DATA; Schema: v2; Owner: postgres
--

COPY v2.vision_observation_details (observation_id, before_image_url, after_image_url, crop_url, model_version, raw_predictions_json, created_at) FROM stdin;
\.


--
-- Name: approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approvals_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 14, true);


--
-- Name: compartments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compartments_id_seq', 1, false);


--
-- Name: detection_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detection_events_id_seq', 1, false);


--
-- Name: drawer_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drawer_sessions_id_seq', 1, false);


--
-- Name: drawer_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drawer_slots_id_seq', 60, true);


--
-- Name: drawer_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drawer_snapshots_id_seq', 1, false);


--
-- Name: drawers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.drawers_id_seq', 3, true);


--
-- Name: exception_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exception_cases_id_seq', 1, false);


--
-- Name: inventory_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventory_events_id_seq', 1, false);


--
-- Name: item_type_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.item_type_images_id_seq', 1, false);


--
-- Name: item_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.item_types_id_seq', 27, true);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 3, true);


--
-- Name: loans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.loans_id_seq', 8, true);


--
-- Name: slot_occupancies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.slot_occupancies_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: access_sessions_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.access_sessions_id_seq', 1, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.audit_logs_id_seq', 14, true);


--
-- Name: inventory_events_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.inventory_events_id_seq', 1, true);


--
-- Name: item_type_images_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.item_type_images_id_seq', 1, true);


--
-- Name: item_types_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.item_types_id_seq', 27, true);


--
-- Name: observations_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.observations_id_seq', 1, true);


--
-- Name: storage_locations_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.storage_locations_id_seq', 60, true);


--
-- Name: storage_units_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.storage_units_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: v2; Owner: postgres
--

SELECT pg_catalog.setval('v2.users_id_seq', 3, true);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: compartments compartments_locker_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compartments
    ADD CONSTRAINT compartments_locker_number_key UNIQUE (locker_number);


--
-- Name: compartments compartments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compartments
    ADD CONSTRAINT compartments_pkey PRIMARY KEY (id);


--
-- Name: detection_events detection_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_pkey PRIMARY KEY (id);


--
-- Name: drawer_sessions drawer_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_sessions
    ADD CONSTRAINT drawer_sessions_pkey PRIMARY KEY (id);


--
-- Name: drawer_slots drawer_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_slots
    ADD CONSTRAINT drawer_slots_pkey PRIMARY KEY (id);


--
-- Name: drawer_snapshots drawer_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_snapshots
    ADD CONSTRAINT drawer_snapshots_pkey PRIMARY KEY (id);


--
-- Name: drawers drawers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawers
    ADD CONSTRAINT drawers_pkey PRIMARY KEY (id);


--
-- Name: exception_cases exception_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exception_cases
    ADD CONSTRAINT exception_cases_pkey PRIMARY KEY (id);


--
-- Name: inventory_events inventory_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events
    ADD CONSTRAINT inventory_events_pkey PRIMARY KEY (id);


--
-- Name: item_type_images item_type_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_type_images
    ADD CONSTRAINT item_type_images_pkey PRIMARY KEY (id);


--
-- Name: item_types item_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_types
    ADD CONSTRAINT item_types_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: slot_occupancies slot_occupancies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_occupancies
    ADD CONSTRAINT slot_occupancies_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: access_sessions access_sessions_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.access_sessions
    ADD CONSTRAINT access_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: inventory_events inventory_events_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_pkey PRIMARY KEY (id);


--
-- Name: item_type_images item_type_images_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.item_type_images
    ADD CONSTRAINT item_type_images_pkey PRIMARY KEY (id);


--
-- Name: item_types item_types_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.item_types
    ADD CONSTRAINT item_types_pkey PRIMARY KEY (id);


--
-- Name: observations observations_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.observations
    ADD CONSTRAINT observations_pkey PRIMARY KEY (id);


--
-- Name: rfid_observation_details rfid_observation_details_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.rfid_observation_details
    ADD CONSTRAINT rfid_observation_details_pkey PRIMARY KEY (observation_id);


--
-- Name: slot_occupancies slot_occupancies_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.slot_occupancies
    ADD CONSTRAINT slot_occupancies_pkey PRIMARY KEY (location_id);


--
-- Name: storage_locations storage_locations_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.storage_locations
    ADD CONSTRAINT storage_locations_pkey PRIMARY KEY (id);


--
-- Name: storage_units storage_units_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.storage_units
    ADD CONSTRAINT storage_units_pkey PRIMARY KEY (id);


--
-- Name: users users_nfc_card_uid_key; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.users
    ADD CONSTRAINT users_nfc_card_uid_key UNIQUE (nfc_card_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vision_observation_details vision_observation_details_pkey; Type: CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.vision_observation_details
    ADD CONSTRAINT vision_observation_details_pkey PRIMARY KEY (observation_id);


--
-- Name: ix_approvals_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_approvals_id ON public.approvals USING btree (id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: ix_compartments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_compartments_id ON public.compartments USING btree (id);


--
-- Name: ix_detection_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_detection_events_id ON public.detection_events USING btree (id);


--
-- Name: ix_detection_events_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_detection_events_session_id ON public.detection_events USING btree (session_id);


--
-- Name: ix_detection_events_slot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_detection_events_slot_id ON public.detection_events USING btree (slot_id);


--
-- Name: ix_drawer_sessions_drawer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_sessions_drawer_id ON public.drawer_sessions USING btree (drawer_id);


--
-- Name: ix_drawer_sessions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_sessions_id ON public.drawer_sessions USING btree (id);


--
-- Name: ix_drawer_sessions_user_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_sessions_user_uid ON public.drawer_sessions USING btree (user_uid);


--
-- Name: ix_drawer_slots_drawer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_slots_drawer_id ON public.drawer_slots USING btree (drawer_id);


--
-- Name: ix_drawer_slots_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_slots_id ON public.drawer_slots USING btree (id);


--
-- Name: ix_drawer_slots_slot_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_slots_slot_code ON public.drawer_slots USING btree (slot_code);


--
-- Name: ix_drawer_snapshots_drawer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_snapshots_drawer_id ON public.drawer_snapshots USING btree (drawer_id);


--
-- Name: ix_drawer_snapshots_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_snapshots_id ON public.drawer_snapshots USING btree (id);


--
-- Name: ix_drawer_snapshots_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawer_snapshots_session_id ON public.drawer_snapshots USING btree (session_id);


--
-- Name: ix_drawers_cabinet_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawers_cabinet_code ON public.drawers USING btree (cabinet_code);


--
-- Name: ix_drawers_drawer_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_drawers_drawer_code ON public.drawers USING btree (drawer_code);


--
-- Name: ix_drawers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_drawers_id ON public.drawers USING btree (id);


--
-- Name: ix_exception_cases_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exception_cases_id ON public.exception_cases USING btree (id);


--
-- Name: ix_exception_cases_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_exception_cases_session_id ON public.exception_cases USING btree (session_id);


--
-- Name: ix_inventory_events_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_events_id ON public.inventory_events USING btree (id);


--
-- Name: ix_inventory_events_item_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_events_item_type_id ON public.inventory_events USING btree (item_type_id);


--
-- Name: ix_inventory_events_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_events_session_id ON public.inventory_events USING btree (session_id);


--
-- Name: ix_inventory_events_user_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_inventory_events_user_uid ON public.inventory_events USING btree (user_uid);


--
-- Name: ix_item_type_images_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_item_type_images_id ON public.item_type_images USING btree (id);


--
-- Name: ix_item_type_images_item_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_item_type_images_item_type_id ON public.item_type_images USING btree (item_type_id);


--
-- Name: ix_item_types_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_item_types_code ON public.item_types USING btree (code);


--
-- Name: ix_item_types_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_item_types_id ON public.item_types USING btree (id);


--
-- Name: ix_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_items_id ON public.items USING btree (id);


--
-- Name: ix_items_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_items_uid ON public.items USING btree (uid);


--
-- Name: ix_loans_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_loans_id ON public.loans USING btree (id);


--
-- Name: ix_loans_item_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_loans_item_uid ON public.loans USING btree (item_uid);


--
-- Name: ix_loans_user_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_loans_user_uid ON public.loans USING btree (user_uid);


--
-- Name: ix_slot_occupancies_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_slot_occupancies_id ON public.slot_occupancies USING btree (id);


--
-- Name: ix_slot_occupancies_slot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_slot_occupancies_slot_id ON public.slot_occupancies USING btree (slot_id);


--
-- Name: ix_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_transactions_id ON public.transactions USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_uid ON public.users USING btree (uid);


--
-- Name: idx_access_sessions_opened_at; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_access_sessions_opened_at ON v2.access_sessions USING btree (opened_at);


--
-- Name: idx_access_sessions_status; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_access_sessions_status ON v2.access_sessions USING btree (status);


--
-- Name: idx_access_sessions_unit_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_access_sessions_unit_id ON v2.access_sessions USING btree (unit_id);


--
-- Name: idx_access_sessions_user_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_access_sessions_user_id ON v2.access_sessions USING btree (user_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON v2.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_actor_type; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_audit_logs_actor_type ON v2.audit_logs USING btree (actor_type);


--
-- Name: idx_audit_logs_correlation_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_audit_logs_correlation_id ON v2.audit_logs USING btree (correlation_id);


--
-- Name: idx_audit_logs_ts; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_audit_logs_ts ON v2.audit_logs USING btree (ts);


--
-- Name: idx_inventory_events_created_at; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_inventory_events_created_at ON v2.inventory_events USING btree (created_at);


--
-- Name: idx_inventory_events_event_type; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_inventory_events_event_type ON v2.inventory_events USING btree (event_type);


--
-- Name: idx_inventory_events_item_type_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_inventory_events_item_type_id ON v2.inventory_events USING btree (item_type_id);


--
-- Name: idx_inventory_events_session_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_inventory_events_session_id ON v2.inventory_events USING btree (session_id);


--
-- Name: idx_inventory_events_user_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_inventory_events_user_id ON v2.inventory_events USING btree (user_id);


--
-- Name: idx_item_type_images_is_primary; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_item_type_images_is_primary ON v2.item_type_images USING btree (is_primary);


--
-- Name: idx_item_type_images_item_type_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_item_type_images_item_type_id ON v2.item_type_images USING btree (item_type_id);


--
-- Name: idx_item_types_active; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_item_types_active ON v2.item_types USING btree (active);


--
-- Name: idx_item_types_name; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_item_types_name ON v2.item_types USING btree (name);


--
-- Name: idx_observations_location_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_observations_location_id ON v2.observations USING btree (location_id);


--
-- Name: idx_observations_observed_at; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_observations_observed_at ON v2.observations USING btree (observed_at);


--
-- Name: idx_observations_review_status; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_observations_review_status ON v2.observations USING btree (review_status);


--
-- Name: idx_observations_session_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_observations_session_id ON v2.observations USING btree (session_id);


--
-- Name: idx_observations_source_type; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_observations_source_type ON v2.observations USING btree (source_type);


--
-- Name: idx_rfid_observation_details_tag_uid; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_rfid_observation_details_tag_uid ON v2.rfid_observation_details USING btree (tag_uid);


--
-- Name: idx_slot_occupancies_item_type_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_slot_occupancies_item_type_id ON v2.slot_occupancies USING btree (item_type_id);


--
-- Name: idx_slot_occupancies_state; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_slot_occupancies_state ON v2.slot_occupancies USING btree (state);


--
-- Name: idx_storage_locations_grid; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE UNIQUE INDEX idx_storage_locations_grid ON v2.storage_locations USING btree (unit_id, level_no, row_no, col_no) WHERE ((row_no IS NOT NULL) AND (col_no IS NOT NULL));


--
-- Name: idx_storage_locations_location; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_storage_locations_location ON v2.storage_locations USING btree (unit_id, level_no);


--
-- Name: idx_storage_locations_unit_id; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_storage_locations_unit_id ON v2.storage_locations USING btree (unit_id);


--
-- Name: idx_storage_locations_zone; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE UNIQUE INDEX idx_storage_locations_zone ON v2.storage_locations USING btree (unit_id, level_no, zone_code) WHERE (zone_code IS NOT NULL);


--
-- Name: idx_storage_units_layout_type; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_storage_units_layout_type ON v2.storage_units USING btree (layout_type);


--
-- Name: idx_storage_units_unit_type; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_storage_units_unit_type ON v2.storage_units USING btree (unit_type);


--
-- Name: idx_users_nfc_card_uid; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_users_nfc_card_uid ON v2.users USING btree (nfc_card_uid);


--
-- Name: idx_users_role; Type: INDEX; Schema: v2; Owner: postgres
--

CREATE INDEX idx_users_role ON v2.users USING btree (role);


--
-- Name: detection_events detection_events_after_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_after_snapshot_id_fkey FOREIGN KEY (after_snapshot_id) REFERENCES public.drawer_snapshots(id);


--
-- Name: detection_events detection_events_before_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_before_snapshot_id_fkey FOREIGN KEY (before_snapshot_id) REFERENCES public.drawer_snapshots(id);


--
-- Name: detection_events detection_events_predicted_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_predicted_item_type_id_fkey FOREIGN KEY (predicted_item_type_id) REFERENCES public.item_types(id);


--
-- Name: detection_events detection_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.drawer_sessions(id);


--
-- Name: detection_events detection_events_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detection_events
    ADD CONSTRAINT detection_events_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.drawer_slots(id);


--
-- Name: drawer_sessions drawer_sessions_drawer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_sessions
    ADD CONSTRAINT drawer_sessions_drawer_id_fkey FOREIGN KEY (drawer_id) REFERENCES public.drawers(id);


--
-- Name: drawer_slots drawer_slots_drawer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_slots
    ADD CONSTRAINT drawer_slots_drawer_id_fkey FOREIGN KEY (drawer_id) REFERENCES public.drawers(id);


--
-- Name: drawer_snapshots drawer_snapshots_drawer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_snapshots
    ADD CONSTRAINT drawer_snapshots_drawer_id_fkey FOREIGN KEY (drawer_id) REFERENCES public.drawers(id);


--
-- Name: drawer_snapshots drawer_snapshots_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drawer_snapshots
    ADD CONSTRAINT drawer_snapshots_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.drawer_sessions(id);


--
-- Name: exception_cases exception_cases_detection_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exception_cases
    ADD CONSTRAINT exception_cases_detection_event_id_fkey FOREIGN KEY (detection_event_id) REFERENCES public.detection_events(id);


--
-- Name: exception_cases exception_cases_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exception_cases
    ADD CONSTRAINT exception_cases_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.drawer_sessions(id);


--
-- Name: exception_cases exception_cases_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exception_cases
    ADD CONSTRAINT exception_cases_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.drawer_slots(id);


--
-- Name: inventory_events inventory_events_detection_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events
    ADD CONSTRAINT inventory_events_detection_event_id_fkey FOREIGN KEY (detection_event_id) REFERENCES public.detection_events(id);


--
-- Name: inventory_events inventory_events_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events
    ADD CONSTRAINT inventory_events_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_types(id);


--
-- Name: inventory_events inventory_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events
    ADD CONSTRAINT inventory_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.drawer_sessions(id);


--
-- Name: inventory_events inventory_events_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_events
    ADD CONSTRAINT inventory_events_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.drawer_slots(id);


--
-- Name: item_type_images item_type_images_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_type_images
    ADD CONSTRAINT item_type_images_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_types(id);


--
-- Name: slot_occupancies slot_occupancies_item_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_occupancies
    ADD CONSTRAINT slot_occupancies_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES public.item_types(id);


--
-- Name: slot_occupancies slot_occupancies_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_occupancies
    ADD CONSTRAINT slot_occupancies_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.drawer_slots(id);


--
-- Name: slot_occupancies slot_occupancies_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.slot_occupancies
    ADD CONSTRAINT slot_occupancies_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.drawer_snapshots(id);


--
-- Name: access_sessions access_sessions_unit_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.access_sessions
    ADD CONSTRAINT access_sessions_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES v2.storage_units(id) ON DELETE RESTRICT;


--
-- Name: access_sessions access_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.access_sessions
    ADD CONSTRAINT access_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES v2.users(id) ON DELETE RESTRICT;


--
-- Name: inventory_events inventory_events_item_type_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES v2.item_types(id) ON DELETE RESTRICT;


--
-- Name: inventory_events inventory_events_location_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_location_id_fkey FOREIGN KEY (location_id) REFERENCES v2.storage_locations(id) ON DELETE SET NULL;


--
-- Name: inventory_events inventory_events_observation_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES v2.observations(id) ON DELETE SET NULL;


--
-- Name: inventory_events inventory_events_session_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES v2.access_sessions(id) ON DELETE RESTRICT;


--
-- Name: inventory_events inventory_events_user_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.inventory_events
    ADD CONSTRAINT inventory_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES v2.users(id) ON DELETE RESTRICT;


--
-- Name: item_type_images item_type_images_item_type_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.item_type_images
    ADD CONSTRAINT item_type_images_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES v2.item_types(id) ON DELETE CASCADE;


--
-- Name: observations observations_location_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.observations
    ADD CONSTRAINT observations_location_id_fkey FOREIGN KEY (location_id) REFERENCES v2.storage_locations(id) ON DELETE SET NULL;


--
-- Name: observations observations_session_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.observations
    ADD CONSTRAINT observations_session_id_fkey FOREIGN KEY (session_id) REFERENCES v2.access_sessions(id) ON DELETE RESTRICT;


--
-- Name: rfid_observation_details rfid_observation_details_observation_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.rfid_observation_details
    ADD CONSTRAINT rfid_observation_details_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES v2.observations(id) ON DELETE CASCADE;


--
-- Name: slot_occupancies slot_occupancies_item_type_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.slot_occupancies
    ADD CONSTRAINT slot_occupancies_item_type_id_fkey FOREIGN KEY (item_type_id) REFERENCES v2.item_types(id) ON DELETE SET NULL;


--
-- Name: slot_occupancies slot_occupancies_last_event_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.slot_occupancies
    ADD CONSTRAINT slot_occupancies_last_event_id_fkey FOREIGN KEY (last_event_id) REFERENCES v2.inventory_events(id) ON DELETE SET NULL;


--
-- Name: slot_occupancies slot_occupancies_location_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.slot_occupancies
    ADD CONSTRAINT slot_occupancies_location_id_fkey FOREIGN KEY (location_id) REFERENCES v2.storage_locations(id) ON DELETE CASCADE;


--
-- Name: storage_locations storage_locations_unit_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.storage_locations
    ADD CONSTRAINT storage_locations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES v2.storage_units(id) ON DELETE CASCADE;


--
-- Name: vision_observation_details vision_observation_details_observation_id_fkey; Type: FK CONSTRAINT; Schema: v2; Owner: postgres
--

ALTER TABLE ONLY v2.vision_observation_details
    ADD CONSTRAINT vision_observation_details_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES v2.observations(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mJHx9Pu2onudK3c8Xmi5RLeK7pIDYFg99aL9VW30lAKSEw295U5bSJPMBaoTxOv

