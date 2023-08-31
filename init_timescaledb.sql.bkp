-- Create a new table for time-series data
CREATE EXTENSION btree_gist;
CREATE TABLE IF NOT EXISTS job_details
(
    id serial,
    machine text NOT NULL,
    job_name text NOT NULL,
    operator_name text NOT NULL,
    shift tsrange NOT NULL,
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
    eventtime timestamp without time zone NOT NULL
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
