BEGIN;

ALTER TABLE land_stalls
  ADD COLUMN IF NOT EXISTS administration_type VARCHAR(10) NOT NULL DEFAULT 'kip',
  ADD COLUMN IF NOT EXISTS fixed_annual_fee NUMERIC(18,2) NOT NULL DEFAULT 0;

UPDATE land_stalls SET administration_type = 'kip'
WHERE administration_type IS NULL OR administration_type NOT IN ('kip', 'kkip');

ALTER TABLE land_stalls
  DROP CONSTRAINT IF EXISTS land_stalls_administration_type_check,
  DROP CONSTRAINT IF EXISTS land_stalls_pricing_by_administration_check;

ALTER TABLE land_stalls
  ADD CONSTRAINT land_stalls_administration_type_check
    CHECK (administration_type IN ('kip', 'kkip')),
  ADD CONSTRAINT land_stalls_pricing_by_administration_check
    CHECK (
      (administration_type = 'kip' AND stall_length > 0 AND stall_width > 0
        AND price_per_m2 > 0 AND fixed_annual_fee = 0)
      OR
      (administration_type = 'kkip' AND stall_length = 0 AND stall_width = 0
        AND price_per_m2 = 0 AND fixed_annual_fee > 0)
    );
COMMIT;
