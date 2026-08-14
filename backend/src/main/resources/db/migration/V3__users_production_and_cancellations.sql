CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE basket_templates ADD COLUMN stock_quantity NUMERIC(15,3) NOT NULL DEFAULT 0;
ALTER TABLE basket_templates ADD COLUMN minimum_stock NUMERIC(15,3) NOT NULL DEFAULT 0;

CREATE TABLE production_orders (
    id BIGSERIAL PRIMARY KEY,
    basket_id BIGINT NOT NULL REFERENCES basket_templates(id),
    quantity NUMERIC(15,3) NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    produced_at TIMESTAMPTZ NOT NULL,
    responsible VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE basket_movements (
    id BIGSERIAL PRIMARY KEY,
    basket_id BIGINT NOT NULL REFERENCES basket_templates(id),
    type VARCHAR(20) NOT NULL,
    reason VARCHAR(30) NOT NULL,
    quantity NUMERIC(15,3) NOT NULL,
    balance_after NUMERIC(15,3) NOT NULL,
    reference_id BIGINT,
    notes VARCHAR(255),
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE sales ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED';
ALTER TABLE sales ADD COLUMN cancelled_at TIMESTAMPTZ;
ALTER TABLE sales ADD COLUMN cancellation_reason VARCHAR(255);

CREATE INDEX idx_production_produced_at ON production_orders(produced_at);
CREATE INDEX idx_basket_movement_basket ON basket_movements(basket_id);
