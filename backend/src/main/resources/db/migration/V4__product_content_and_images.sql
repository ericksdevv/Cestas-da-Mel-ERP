ALTER TABLE products ADD COLUMN content_quantity NUMERIC(15,3);
ALTER TABLE products ADD COLUMN content_unit VARCHAR(30);
ALTER TABLE products ADD COLUMN image_content_type VARCHAR(60);
ALTER TABLE products ADD COLUMN image_data BYTEA;

-- Cadastros antigos medidos em g/kg/ml/L representavam o conteúdo da embalagem.
-- Como o saldo real em unidades não pode ser inferido, ele começa zerado para conferência.
UPDATE products
SET content_quantity = quantity,
    content_unit = unit,
    quantity = 0
WHERE unit IN ('KG', 'G', 'L', 'ML', 'M', 'CM');

UPDATE products SET unit = 'UNIT';
