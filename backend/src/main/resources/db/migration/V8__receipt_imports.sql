ALTER TABLE purchases ADD COLUMN receipt_access_key VARCHAR(60);
CREATE UNIQUE INDEX uk_purchases_receipt_access_key
    ON purchases(receipt_access_key)
    WHERE receipt_access_key IS NOT NULL;
