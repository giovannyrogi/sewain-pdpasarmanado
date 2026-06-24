BEGIN;

ALTER TABLE tenant_identities
  ADD COLUMN IF NOT EXISTS is_room_rental_registered BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_land_permit_registered BOOLEAN;

UPDATE tenant_identities ti
SET
  is_land_permit_registered = (
    ti.profile_photo_file_path IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM land_permit_applications lpa
      WHERE lpa.tenant_identity_id = ti.id
    )
  ),
  is_room_rental_registered = (
    EXISTS (
      SELECT 1
      FROM tenant_application ta
      WHERE ta.tenant_identity_id = ti.id
    )
    OR NOT (
      ti.profile_photo_file_path IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM land_permit_applications lpa
        WHERE lpa.tenant_identity_id = ti.id
      )
    )
  )
WHERE
  ti.is_room_rental_registered IS NULL
  OR ti.is_land_permit_registered IS NULL;

ALTER TABLE tenant_identities
  ALTER COLUMN is_room_rental_registered SET DEFAULT FALSE,
  ALTER COLUMN is_room_rental_registered SET NOT NULL,
  ALTER COLUMN is_land_permit_registered SET DEFAULT FALSE,
  ALTER COLUMN is_land_permit_registered SET NOT NULL;

ALTER TABLE tenant_identities
  DROP CONSTRAINT IF EXISTS tenant_identities_registration_scope_check;

ALTER TABLE tenant_identities
  ADD CONSTRAINT tenant_identities_registration_scope_check
  CHECK (is_room_rental_registered OR is_land_permit_registered);

COMMIT;
