CREATE TABLE item_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX uq_item_categories_name_type
    ON item_categories (type, LOWER(name))
    WHERE deleted_at IS NULL;

ALTER TABLE products ADD COLUMN category_id BIGINT REFERENCES item_categories(id);
ALTER TABLE materials ADD COLUMN category_id BIGINT REFERENCES item_categories(id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_materials_category ON materials(category_id);
