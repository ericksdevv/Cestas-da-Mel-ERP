CREATE TABLE history_clearances (
    id BIGSERIAL PRIMARY KEY,
    history_type VARCHAR(40) NOT NULL UNIQUE,
    cleared_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
