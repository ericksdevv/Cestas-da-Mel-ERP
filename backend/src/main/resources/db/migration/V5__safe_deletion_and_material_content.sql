ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE basket_templates ADD COLUMN deleted_at TIMESTAMPTZ;

ALTER TABLE materials ADD COLUMN content_quantity NUMERIC(15,3);
ALTER TABLE materials ADD COLUMN content_unit VARCHAR(30);

CREATE INDEX idx_products_not_deleted ON products (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_materials_not_deleted ON materials (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_baskets_not_deleted ON basket_templates (name) WHERE deleted_at IS NULL;
