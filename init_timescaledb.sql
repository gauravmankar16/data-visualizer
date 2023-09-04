-- Create a new table for time-series data
CREATE EXTENSION btree_gist;
CREATE TABLE IF NOT EXISTS job_details
(
    id serial,
    machine text NOT NULL,
    job_name text NOT NULL,
    operator_name text NOT NULL,
    shift tstzrange NOT NULL,
    target_qty integer NOT NULL,
    actual_qty integer NOT NULL,
    remarks text,
    updated_by text,
    start_time timestamp WITH TIME ZONE NOT NULL,
    end_time timestamp WITH TIME ZONE NOT NULL,
    CONSTRAINT job_details_pkey PRIMARY KEY (id),
    CONSTRAINT job_details_machine_shift_excl EXCLUDE USING gist (
        machine WITH =,
        shift WITH &&)
);

CREATE TABLE IF NOT EXISTS sensor
(
    machine text NOT NULL,
    eventtime timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users
(
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    created_on timestamp without time zone NOT NULL,
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username)
);

INSERT INTO users(
	id, username, password, email, created_on)
	VALUES (1, 'gau', 'gau', 'gau', '7/23/2023, 3:59:41 PM');
	
CREATE TABLE IF NOT EXISTS machines
(
    name text NOT NULL,
    create_ts timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.machines 
("name" , create_ts)
VALUES('WELDING-B1', CURRENT_TIMESTAMP),
('WELDING-B2', CURRENT_TIMESTAMP),
('WELDING-B3', CURRENT_TIMESTAMP),
('WELDING-B4', CURRENT_TIMESTAMP),
('WELDING-B15', CURRENT_TIMESTAMP),
('WELDING-B22', CURRENT_TIMESTAMP),
('WELDING-B25', CURRENT_TIMESTAMP),
('WELDING-B26', CURRENT_TIMESTAMP),
('WELDING-B30', CURRENT_TIMESTAMP),
('WELDING-B31', CURRENT_TIMESTAMP);


SELECT create_hypertable('sensor', 'eventtime', chunk_time_interval => interval '1 day', if_not_exists => TRUE);	
