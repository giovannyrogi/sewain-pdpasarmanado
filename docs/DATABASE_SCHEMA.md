# SewaIN Database Schema

This document describes the current PostgreSQL database structure for SewaIN.

Use this file only when database knowledge is relevant to the task.

Do not modify database schema unless explicitly requested.

---

## Core Principles

* Database engine: PostgreSQL.
* Primary keys mostly use `SERIAL PRIMARY KEY`.
* Most tables use `created_at` and `updated_at`.
* `updated_at` is maintained by database triggers.
* Use parameterized queries for all database access.
* Avoid `SELECT *` in new code.
* Fetch only required fields.
* Use transactions for critical multi-step writes.
* Do not silently change schema from UI-only or frontend-only tasks.

---

# Master Data Tables

## `locations`

Stores market/building/location data.

| Column           | Type           | Constraint / Default        | Description                                                |
| ---------------- | -------------- | --------------------------- | ---------------------------------------------------------- |
| `id`             | `SERIAL`       | `PRIMARY KEY`               | Location ID                                                |
| `location_name`  | `VARCHAR(100)` | `NOT NULL`                  | Location/building/market name                              |
| `street_address` | `TEXT`         | nullable                    | Street address                                             |
| `location_code`  | `VARCHAR(50)`  | nullable                    | Location code                                              |
| `kelurahan`      | `VARCHAR(100)` | nullable                    | Kelurahan / Desa                                           |
| `district`       | `VARCHAR(100)` | nullable                    | Kecamatan                                                  |
| `city`           | `VARCHAR(100)` | nullable                    | Kota / Kabupaten                                           |
| `province`       | `VARCHAR(100)` | nullable                    | Province                                                   |
| `postal_code`    | `VARCHAR(10)`  | nullable                    | Postal code                                                |
| `longtitude`     | `VARCHAR(50)`  | nullable                    | Longitude value. Note: current column name is `longtitude` |
| `latitude`       | `VARCHAR(50)`  | nullable                    | Latitude value                                             |
| `updated_at`     | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp                                      |
| `created_at`     | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp                                         |

Indexes:

* Unique index on `LOWER(location_code)`
* Unique index on `LOWER(location_name)`

---

## `location_floor_prices`

Stores floor data per location.

| Column        | Type          | Constraint / Default        | Description                               |
| ------------- | ------------- | --------------------------- | ----------------------------------------- |
| `id`          | `SERIAL`      | `PRIMARY KEY`               | Floor price ID                            |
| `location_id` | `INTEGER`     | `REFERENCES locations(id)`  | Related location                          |
| `floor`       | `VARCHAR(10)` | nullable                    | Floor code, example: `1`, `2`, `LG`, `UG` |
| `updated_at`  | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp                     |
| `created_at`  | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp                        |

Indexes:

* Unique index on `(location_id, LOWER(floor))`

Notes:

* `base_price` is currently commented out in the schema.
* Room pricing currently uses `rooms.price_per_m2`.

---

## `rooms`

Stores rentable room data.

| Column         | Type            | Constraint / Default                   | Description                                  |
| -------------- | --------------- | -------------------------------------- | -------------------------------------------- |
| `id`           | `SERIAL`        | `PRIMARY KEY`                          | Room ID                                      |
| `location_id`  | `INTEGER`       | `REFERENCES locations(id)`             | Related location                             |
| `room_number`  | `VARCHAR(20)`   | `NOT NULL`                             | Room number/code                             |
| `floor_id`     | `INTEGER`       | `REFERENCES location_floor_prices(id)` | Related floor                                |
| `room_length`  | `NUMERIC(8,2)`  | nullable                               | Room length                                  |
| `room_width`   | `NUMERIC(8,2)`  | nullable                               | Room width                                   |
| `room_area`    | `NUMERIC(18,2)` | generated stored                       | Auto-generated as `room_length * room_width` |
| `price_per_m2` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                   | Room price per square meter                  |
| `status`       | `VARCHAR(20)`   | `DEFAULT 'available'`                  | Room availability status                     |
| `notes`        | `TEXT`          | nullable                               | Room notes                                   |
| `updated_at`   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`            | Last update timestamp                        |
| `created_at`   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`            | Creation timestamp                           |

Allowed `status` values:

* `available`
* `occupied`
* `unavailable`
* `maintenance`

Important:

* `room_area` is generated by the database. Do not manually insert/update it.
* `tenant_application.room_id` must belong to the same `location_id`. This is enforced by `trg_validate_room_location`.

---

## `room_status_sync_runs`

Stores summary audit logs for automatic/manual room status synchronization.

```sql
CREATE TABLE IF NOT EXISTS room_status_sync_runs (
  id VARCHAR(36) PRIMARY KEY,
  trigger_source VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_checked INTEGER DEFAULT 0,
  total_released INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_room_status_sync_runs_started_at
ON room_status_sync_runs (started_at DESC);
```

Allowed `trigger_source` values:

* `cron`
* `manual`

Allowed `status` values:

* `running`
* `completed`
* `skipped`
* `failed`

---

## `room_status_sync_items`

Stores per-room audit details for each room status synchronization run.

```sql
CREATE TABLE IF NOT EXISTS room_status_sync_items (
  id BIGSERIAL PRIMARY KEY,
  run_id VARCHAR(36) NOT NULL REFERENCES room_status_sync_runs(id) ON DELETE CASCADE,
  room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  tenant_application_id INTEGER REFERENCES tenant_application(id) ON DELETE SET NULL,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  tenant_name VARCHAR(160),
  location_name VARCHAR(160),
  room_number VARCHAR(50),
  document_number VARCHAR(50),
  contract_number VARCHAR(80),
  lease_start_date DATE,
  lease_end_date DATE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_room_status_sync_items_run_id
ON room_status_sync_items (run_id);

CREATE INDEX IF NOT EXISTS idx_room_status_sync_items_room_id
ON room_status_sync_items (room_id);
```

Allowed `action` values:

* `released`
* `skipped`

Important:

* Room status synchronization is only triggered by the VPS cron endpoint or the superadmin manual sync page.
* Do not run room release logic from dashboard, report, or ordinary list APIs.
* Payment arrears do not block physical room release. Payment monitoring remains in payment reports.

---

## `roles`

Stores user roles.

| Column       | Type          | Constraint / Default        | Description           |
| ------------ | ------------- | --------------------------- | --------------------- |
| `id`         | `SERIAL`      | `PRIMARY KEY`               | Role ID               |
| `role_name`  | `VARCHAR(50)` | `NOT NULL UNIQUE`           | Role name             |
| `updated_at` | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp |
| `created_at` | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp    |

---

## `users`

Stores application users.

| Column       | Type           | Constraint / Default        | Description           |
| ------------ | -------------- | --------------------------- | --------------------- |
| `id`         | `SERIAL`       | `PRIMARY KEY`               | User ID               |
| `full_name`  | `VARCHAR(100)` | `NOT NULL`                  | User full name        |
| `username`   | `VARCHAR(100)` | `NOT NULL`                  | Username              |
| `password`   | `TEXT`         | `NOT NULL`                  | Hashed password       |
| `email`      | `VARCHAR(100)` | `UNIQUE`                    | User email            |
| `role_id`    | `INTEGER`      | `REFERENCES roles(id)`      | User role             |
| `updated_at` | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp |
| `created_at` | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp    |

Security notes:

* Never store plain-text passwords.
* Never trust role or user identity from frontend payload.
* Authenticated actor must come from session/auth helpers.

---

## `tenant_identities`

Stores tenant identity data.

| Column           | Type           | Constraint / Default        | Description            |
| ---------------- | -------------- | --------------------------- | ---------------------- |
| `id`             | `SERIAL`       | `PRIMARY KEY`               | Tenant identity ID     |
| `user_id`        | `INTEGER`      | `REFERENCES users(id)`      | Optional related user  |
| `nik`            | `VARCHAR(20)`  | `UNIQUE NOT NULL`           | KTP/NIK number         |
| `full_name`      | `VARCHAR(100)` | `NOT NULL`                  | Tenant full name       |
| `ktp_file_path`  | `TEXT`         | `NOT NULL`                  | KTP file path/URL      |
| `profile_photo_file_path` | `TEXT` | nullable | Optional profile/pass photo path for land permit documents/cards |
| `birth_place`    | `VARCHAR(50)`  | nullable                    | Birth place            |
| `birth_date`     | `DATE`         | nullable                    | Birth date             |
| `nationality`    | `VARCHAR(50)`  | nullable                    | Nationality            |
| `religion`       | `VARCHAR(50)`  | nullable                    | Religion               |
| `occupation`     | `VARCHAR(100)` | nullable                    | Occupation             |
| `street_address` | `TEXT`         | nullable                    | Street address         |
| `rt`             | `VARCHAR(3)`   | nullable                    | RT                     |
| `rw`             | `VARCHAR(3)`   | nullable                    | RW                     |
| `kelurahan`      | `VARCHAR(100)` | nullable                    | Kelurahan / Desa       |
| `district`       | `VARCHAR(100)` | nullable                    | Kecamatan              |
| `city`           | `VARCHAR(100)` | nullable                    | Kota / Kabupaten       |
| `province`       | `VARCHAR(100)` | nullable                    | Province               |
| `postal_code`    | `VARCHAR(10)`  | nullable                    | Postal code            |
| `phone`          | `VARCHAR(20)`  | nullable                    | Phone number           |
| `status`                         | `VARCHAR(20)`  | `DEFAULT 'active'`          | Room rental/general identity status      |
| `notes`                          | `TEXT`         | nullable                    | Room rental/general identity notes       |
| `land_permit_status`             | `VARCHAR(20)`  | `DEFAULT 'active'`          | Land permit identity status              |
| `land_permit_status_notes`       | `TEXT`         | nullable                    | Land permit-specific status notes        |
| `land_permit_status_updated_at`  | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Last land permit status update timestamp |
| `is_room_rental_registered`      | `BOOLEAN`      | `NOT NULL DEFAULT FALSE`    | Identity is registered for room rental   |
| `is_land_permit_registered`      | `BOOLEAN`      | `NOT NULL DEFAULT FALSE`    | Identity is registered for land permits  |
| `updated_at`                     | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Last update timestamp                    |
| `created_at`                     | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp                       |

Allowed `status` values:

* `active`
* `inactive`
* `blacklisted`

Allowed `land_permit_status` values:

* `active`
* `inactive`
* `blacklisted`

Important:

* `tenant_identities.status` is kept for the existing room rental/general identity flow.
* `tenant_identities.land_permit_status` isolates land permit eligibility so a
  land permit nonactive/blacklist decision does not automatically affect room
  rental eligibility, and vice versa.
* `tenant_identities.profile_photo_file_path` is optional and intended for land
  permit documents/cards. Room rental flows must not require this photo.
* At least one registration flag must be true. Disabling a module uses its
  module-specific status and does not remove the registration flag or history.

---

# Transaction And Approval Tables

## `tenant_application`

Stores room rental applications.

| Column                         | Type            | Constraint / Default                                  | Description                             |
| ------------------------------ | --------------- | ----------------------------------------------------- | --------------------------------------- |
| `id`                           | `SERIAL`        | `PRIMARY KEY`                                         | Tenant application ID                   |
| `renewal_of`                   | `INTEGER`       | `REFERENCES tenant_application(id) ON DELETE CASCADE` | Original application if this is renewal |
| `user_id`                      | `INTEGER`       | `REFERENCES users(id)`                                | User who created the application        |
| `tenant_identity_id`           | `INTEGER`       | `REFERENCES tenant_identities(id)`                    | Tenant identity                         |
| `document_number`              | `VARCHAR(50)`   | nullable                                              | Application document number             |
| `location_id`                  | `INTEGER`       | `REFERENCES locations(id)`                            | Selected location                       |
| `room_id`                      | `INTEGER`       | `REFERENCES rooms(id)`                                | Selected room                           |
| `start_date`                   | `DATE`          | nullable                                              | Contract start date                     |
| `end_date`                     | `DATE`          | nullable                                              | Contract end date                       |
| `payment_type`                 | `VARCHAR(20)`   | check constraint                                      | Payment type                            |
| `total_payment_room`           | `NUMERIC(18,2)` | nullable                                              | Total room rental payment               |
| `admin_fee`                    | `NUMERIC(18,2)` | nullable                                              | Administration fee                      |
| `total_ppn`                    | `NUMERIC(18,2)` | nullable                                              | Total PPN                               |
| `total_payment`                | `NUMERIC(18,2)` | `NOT NULL`                                            | Total contract payment                  |
| `down_payment`                 | `NUMERIC(18,2)` | nullable                                              | Down payment for installment            |
| `remaining_payment`            | `NUMERIC(18,2)` | nullable                                              | Remaining payment                       |
| `estimated_installment_1`      | `NUMERIC(18,2)` | nullable                                              | Estimated first installment             |
| `estimated_installment_1_date` | `DATE`          | nullable                                              | Estimated first installment date        |
| `estimated_installment_2`      | `NUMERIC(18,2)` | nullable                                              | Estimated second installment            |
| `estimated_installment_2_date` | `DATE`          | nullable                                              | Estimated second installment date       |
| `estimated_installment_3`      | `NUMERIC(18,2)` | nullable                                              | Estimated third installment             |
| `estimated_installment_3_date` | `DATE`          | nullable                                              | Estimated third installment date        |
| `approval_status`              | `VARCHAR(20)`   | `DEFAULT 'proses'`                                    | Application approval status             |
| `current_step`                 | `INTEGER`       | `DEFAULT 1`                                           | Current approval step                   |
| `current_payment_step`         | `INTEGER`       | `DEFAULT 1`                                           | Current payment/installment step        |
| `is_fully_paid`                | `BOOLEAN`       | `DEFAULT FALSE`                                       | Fully paid status based on payments     |
| `lease_duration_years`         | `INTEGER`       | `DEFAULT 1`                                           | rent duration for 1 year                |
| `annual_room_rent`             | `NUMERIC(18,2)` | nullable                                              | total payment room for 1 year           |
| `updated_at`                   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                           | Last update timestamp                   |
| `created_at`                   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                           | Creation timestamp                      |

Allowed `payment_type` values:

* `lunas`
* `cicilan`

Important:

* `room_id` must belong to `location_id`.
* This is enforced by trigger `trg_validate_room_location`.
* Payment, approval, contract, and termination flows depend on this table.

---

## `tenant_approval`

Stores approval steps for tenant applications.

| Column                  | Type          | Constraint / Default                | Description                    |
| ----------------------- | ------------- | ----------------------------------- | ------------------------------ |
| `id`                    | `SERIAL`      | `PRIMARY KEY`                       | Approval ID                    |
| `tenant_application_id` | `INTEGER`     | `REFERENCES tenant_application(id)` | Related tenant application     |
| `approver_id`           | `INTEGER`     | `REFERENCES users(id)`              | User who approved/rejected     |
| `role_id`               | `INTEGER`     | `REFERENCES roles(id)`              | Role responsible for this step |
| `step_order`            | `INTEGER`     | nullable                            | Approval step order            |
| `approved_at`           | `TIMESTAMP`   | nullable                            | Approval/rejection timestamp   |
| `status`                | `VARCHAR(20)` | `DEFAULT 'pending'`                 | Approval status                |
| `notes`                 | `TEXT`        | nullable                            | Approval/rejection notes       |
| `updated_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Last update timestamp          |
| `created_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Creation timestamp             |

Allowed `status` values:

* `pending`
* `approved`
* `rejected`

Business rules:

* Approval is role-based and step-based.
* Current user role must match the approval step.
* Previous steps must be approved before the current step can approve.
* Do not trust `approver_id` from frontend; derive it from authenticated session.

---

## `tenant_early_terminations`

Stores tenant early termination requests.

| Column                  | Type          | Constraint / Default                                           | Description                   |
| ----------------------- | ------------- | -------------------------------------------------------------- | ----------------------------- |
| `id`                    | `SERIAL`      | `PRIMARY KEY`                                                  | Early termination ID          |
| `tenant_application_id` | `INTEGER`     | `NOT NULL REFERENCES tenant_application(id) ON DELETE CASCADE` | Related tenant application    |
| `reason`                | `TEXT`        | `NOT NULL`                                                     | Termination reason            |
| `statement_file_path`   | `TEXT`        | `NOT NULL`                                                     | Uploaded statement file path  |
| `processed_by`          | `INTEGER`     | `REFERENCES users(id)`                                         | User who processed request    |
| `terminated_at`         | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                                    | Termination request timestamp |
| `current_step`          | `INTEGER`     | `DEFAULT 1`                                                    | Current approval step         |
| `approval_status`       | `VARCHAR(20)` | `DEFAULT 'proses'`                                             | Termination approval status   |
| `is_terminated`         | `BOOLEAN`     | `DEFAULT FALSE`                                                | Final terminated flag         |
| `updated_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                                    | Last update timestamp         |
| `created_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                                    | Creation timestamp            |

Allowed `approval_status` values:

* `proses`
* `approved`
* `rejected`

Indexes:

* `(approval_status, current_step)`

Security:

* Do not trust `processed_by` from frontend.
* Actor must come from authenticated session.

---

## `tenant_termination_approval`

Stores approval steps for tenant termination.

| Column                        | Type          | Constraint / Default                                                  | Description                        |
| ----------------------------- | ------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `id`                          | `SERIAL`      | `PRIMARY KEY`                                                         | Termination approval ID            |
| `tenant_early_termination_id` | `INTEGER`     | `NOT NULL REFERENCES tenant_early_terminations(id) ON DELETE CASCADE` | Related termination request        |
| `role_id`                     | `INTEGER`     | `NOT NULL REFERENCES roles(id)`                                       | Role responsible for approval step |
| `step_order`                  | `INTEGER`     | `NOT NULL`                                                            | Approval step order                |
| `status`                      | `VARCHAR(20)` | `DEFAULT 'pending'`                                                   | Approval status                    |
| `approver_id`                 | `INTEGER`     | `REFERENCES users(id)`                                                | User who approved/rejected         |
| `notes`                       | `TEXT`        | nullable                                                              | Approval/rejection notes           |
| `approved_at`                 | `TIMESTAMP`   | nullable                                                              | Approval/rejection timestamp       |
| `updated_at`                  | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                                           | Last update timestamp              |
| `created_at`                  | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                                           | Creation timestamp                 |

Allowed `status` values:

* `pending`
* `approved`
* `rejected`

Indexes:

* `(role_id, status, tenant_early_termination_id)`
* `(tenant_early_termination_id, step_order)`

---

# Payment Tables

## `payments`

Stores payment uploads and installment payments.

| Column                  | Type            | Constraint / Default                                           | Description                  |
| ----------------------- | --------------- | -------------------------------------------------------------- | ---------------------------- |
| `id`                    | `SERIAL`        | `PRIMARY KEY`                                                  | Payment ID                   |
| `tenant_application_id` | `INTEGER`       | `NOT NULL REFERENCES tenant_application(id) ON DELETE CASCADE` | Related tenant application   |
| `payment_number`        | `INTEGER`       | `CHECK BETWEEN 1 AND 4 DEFAULT 1`                              | Payment/installment number   |
| `amount`                | `NUMERIC(18,2)` | `DEFAULT 0`                                                    | Paid amount                  |
| `contract_amount`       | `NUMERIC(18,2)` | `DEFAULT 0`                                                    | Contract amount portion      |
| `ppn_amount`            | `NUMERIC(18,2)` | `DEFAULT 0`                                                    | PPN amount                   |
| `remaining_balance`     | `NUMERIC(18,2)` | `DEFAULT 0`                                                    | Remaining balance            |
| `payment_date`          | `DATE`          | `NOT NULL`                                                     | Payment date from tenant     |
| `accounting_date`       | `DATE`          | nullable                                                       | Accounting date from finance |
| `proof_file_path`       | `TEXT`          | `NOT NULL`                                                     | Uploaded payment proof path  |
| `uploaded_by`           | `INTEGER`       | `NOT NULL REFERENCES users(id)`                                | User who uploaded proof      |
| `approval_status`       | `VARCHAR(20)`   | `DEFAULT 'pending'`                                            | Payment approval status      |
| `updated_at`            | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                                    | Last update timestamp        |
| `created_at`            | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                                    | Creation timestamp           |

Allowed `approval_status` values:

* `proses`
* `approved`
* `rejected`

Important note:

* Current schema default is `pending`, but check constraint allows only `proses`, `approved`, and `rejected`.
* Verify actual database state before relying on this default.
* Payment verification is separate from tenant approval.
* Finance handles payment validation.

Security:

* Do not trust `uploaded_by` from frontend.
* Actor should come from authenticated session.

---

## `payment_approval`

Stores approval/verification steps for payments.

| Column                     | Type          | Constraint / Default                                 | Description                     |
| -------------------------- | ------------- | ---------------------------------------------------- | ------------------------------- |
| `id`                       | `SERIAL`      | `PRIMARY KEY`                                        | Payment approval ID             |
| `payment_id`               | `INTEGER`     | `NOT NULL REFERENCES payments(id) ON DELETE CASCADE` | Related payment                 |
| `role_id`                  | `INTEGER`     | `NOT NULL REFERENCES roles(id)`                      | Role responsible for approval   |
| `step_order`               | `INTEGER`     | `NOT NULL`                                           | Approval step order             |
| `status`                   | `VARCHAR(20)` | `DEFAULT 'pending'`                                  | Approval status                 |
| `approver_id`              | `INTEGER`     | `REFERENCES users(id)`                               | User who approved/rejected      |
| `notes`                    | `TEXT`        | nullable                                             | Approval/rejection notes        |
| `proof_verified_file_path` | `TEXT`        | nullable                                             | Finance verification proof file |
| `approved_at`              | `TIMESTAMP`   | nullable                                             | Approval/rejection timestamp    |
| `created_at`               | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                          | Creation timestamp              |
| `updated_at`               | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                          | Last update timestamp           |

Allowed `status` values:

* `pending`
* `approved`
* `rejected`

---

## `payment_receipts`

Stores payment receipt documents.

| Column            | Type            | Constraint / Default                                 | Description             |
| ----------------- | --------------- | ---------------------------------------------------- | ----------------------- |
| `id`              | `SERIAL`        | `PRIMARY KEY`                                        | Receipt ID              |
| `payment_id`      | `INTEGER`       | `NOT NULL REFERENCES payments(id) ON DELETE CASCADE` | Related payment         |
| `receipt_type`    | `VARCHAR(20)`   | `NOT NULL`                                           | Receipt type            |
| `receipt_number`  | `VARCHAR(50)`   | `NOT NULL UNIQUE`                                    | Receipt number          |
| `receipt_date`    | `DATE`          | `NOT NULL DEFAULT CURRENT_DATE`                      | Receipt date            |
| `account_code`    | `VARCHAR(20)`   | `NOT NULL`                                           | Accounting account code |
| `amount`          | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                                 | Receipt amount          |
| `contract_amount` | `NUMERIC(18,2)` | `DEFAULT 0`                                          | Contract amount         |
| `ppn_amount`      | `NUMERIC(18,2)` | `DEFAULT 0`                                          | PPN amount              |
| `pph_amount`      | `NUMERIC(18,2)` | `DEFAULT 0`                                          | PPH amount              |
| `description`     | `TEXT`          | nullable                                             | Receipt description     |
| `status`          | `VARCHAR(20)`   | `NOT NULL DEFAULT 'draft'`                           | Receipt status          |
| `printed_at`      | `TIMESTAMP`     | nullable                                             | Print timestamp         |
| `printed_by`      | `INTEGER`       | `REFERENCES users(id)`                               | User who printed        |
| `approved_at`     | `TIMESTAMP`     | nullable                                             | Approval timestamp      |
| `approved_by`     | `INTEGER`       | `REFERENCES users(id)`                               | User who approved       |
| `created_at`      | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                          | Creation timestamp      |
| `updated_at`      | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                          | Last update timestamp   |

Allowed `receipt_type` values:

* `contract`
* `pph`

Allowed `status` values:

* `draft`
* `printed`
* `approved`
* `rejected`
* `void`

Constraints:

* Unique `receipt_number`
* Unique `(payment_id, receipt_type)`

Indexes:

* `payment_id`
* `receipt_type`
* `status`
* `receipt_date`

---

# Land Permit Tables

Land permit tables support the Izin Lahan module. This module is separate from
room rental transactions, but shares `locations`, `users`, `roles`,
`tenant_identities`, and `notifications`.

Schema note:

* The latest land permit structure is documented in this file. The project no
  longer keeps a separate SQL file for this module.

Important:

* `Admin Izin Lahan` uses role ID `9`.
* Land permit pricing does not use PPN, PPH, admin fee, down payment, or installments.
* Land permit payment is full payment only.
* Land permit identity status is stored on `tenant_identities.land_permit_status`.
* Optional land permit pass/profile photo is stored on `tenant_identities.profile_photo_file_path`.
* Commodity/trade type is stored per application in `land_permit_applications`.
* Room rental tables such as `tenant_application`, `payments`, and `contracts`
  must not be reused for land permit transactions.

---

## `land_sectors`

Stores land permit sectors per location.

| Column        | Type           | Constraint / Default                | Description              |
| ------------- | -------------- | ----------------------------------- | ------------------------ |
| `id`          | `SERIAL`       | `PRIMARY KEY`                       | Sector ID                |
| `location_id` | `INTEGER`      | `NOT NULL REFERENCES locations(id)` | Related location         |
| `sector_name` | `VARCHAR(120)` | `NOT NULL`                          | Sector name              |
| `sector_code` | `VARCHAR(50)`  | nullable                            | Optional sector code     |
| `description` | `TEXT`         | nullable                            | Sector notes/description |
| `status`      | `VARCHAR(20)`  | `DEFAULT 'active'`                  | Sector status            |
| `updated_at`  | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP`         | Last update timestamp    |
| `created_at`  | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP`         | Creation timestamp       |

Allowed `status` values:

* `active`
* `inactive`

Constraints:

* Unique `(location_id, sector_name)`
* Unique `(location_id, sector_code)`

---

## `land_stalls`

Stores land permit stalls/plots inside sectors.

| Column         | Type            | Constraint / Default                   | Description                                      |
| -------------- | --------------- | -------------------------------------- | ------------------------------------------------ |
| `id`           | `SERIAL`        | `PRIMARY KEY`                          | Stall ID                                         |
| `location_id`  | `INTEGER`       | `NOT NULL REFERENCES locations(id)`    | Related location                                 |
| `sector_id`    | `INTEGER`       | `NOT NULL REFERENCES land_sectors(id)` | Related sector                                   |
| `stall_number` | `VARCHAR(50)`   | `NOT NULL`                             | Stall/lapak number or label                      |
| `stall_length` | `NUMERIC(8,4)`  | `NOT NULL DEFAULT 0`                   | Stall length                                     |
| `stall_width`  | `NUMERIC(8,4)`  | `NOT NULL DEFAULT 0`                   | Stall width                                      |
| `stall_area`   | `NUMERIC(18,6)` | generated stored                       | Auto-generated as `stall_length * stall_width`   |
| `price_per_m2` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                   | Land permit price per square meter               |
| `administration_type` | `VARCHAR(10)` | `NOT NULL DEFAULT 'kip'`              | Object type: `kip` physical stall or `kkip` area |
| `fixed_annual_fee` | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                    | Fixed annual KKIP fee                             |
| `status`       | `VARCHAR(20)`   | `DEFAULT 'available'`                  | Stall availability status                        |
| `notes`        | `TEXT`          | nullable                               | Notes                                            |
| `updated_at`   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`            | Last update timestamp                            |
| `created_at`   | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`            | Creation timestamp                               |

Allowed `status` values:

* `available`
* `occupied`
* `unavailable`
* `maintenance`

Constraints:

* Unique `(sector_id, stall_number)`
* `administration_type` is limited to `kip` or `kkip`.
* KIP requires positive length, width, and price per m² with zero fixed fee.
* KKIP requires a positive fixed annual fee with zero dimensions and price per m².

---

## `land_permit_applications`

Stores land permit applications.

| Column                 | Type            | Constraint / Default                                | Description                      |
| ---------------------- | --------------- | --------------------------------------------------- | -------------------------------- |
| `id`                   | `SERIAL`        | `PRIMARY KEY`                                       | Land permit application ID       |
| `renewal_of`           | `INTEGER`       | `REFERENCES land_permit_applications(id)`           | Original application if renewal  |
| `application_type`     | `VARCHAR(20)`   | `DEFAULT 'baru'`                                    | New or renewal application       |
| `user_id`              | `INTEGER`       | `REFERENCES users(id)`                              | User who created the application |
| `tenant_identity_id`   | `INTEGER`       | `NOT NULL REFERENCES tenant_identities(id)`         | Related identity                 |
| `commodity_type`       | `VARCHAR(100)`  | `NOT NULL`                                          | Commodity/trade type             |
| `document_number`      | `VARCHAR(80)`   | nullable                                            | Application document number      |
| `location_id`          | `INTEGER`       | `NOT NULL REFERENCES locations(id)`                 | Selected location                |
| `sector_id`            | `INTEGER`       | `NOT NULL REFERENCES land_sectors(id)`              | Selected sector                  |
| `stall_id`             | `INTEGER`       | `NOT NULL REFERENCES land_stalls(id)`               | Selected stall/lapak             |
| `start_date`           | `DATE`          | `NOT NULL`                                          | Permit start date                |
| `end_date`             | `DATE`          | `NOT NULL`                                          | Permit end date                  |
| `lease_duration_years` | `INTEGER`       | `NOT NULL DEFAULT 1`                                | Permit duration in years         |
| `annual_land_rent`     | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                                | Annual land rent                 |
| `total_payment_land`   | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                                | Total rent based on duration     |
| `total_payment`        | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                                | Total payable amount             |
| `approval_status`      | `VARCHAR(20)`   | `DEFAULT 'proses'`                                  | Approval status                  |
| `current_step`         | `INTEGER`       | `DEFAULT 1`                                         | Current approval step            |
| `payment_status`       | `VARCHAR(20)`   | `DEFAULT 'unpaid'`                                  | Payment status                   |
| `is_fully_paid`        | `BOOLEAN`       | `DEFAULT FALSE`                                     | Fully paid flag                  |
| `permit_status`        | `VARCHAR(20)`   | `DEFAULT 'draft'`                                   | Permit lifecycle status          |
| `notes`                | `TEXT`          | nullable                                            | Notes                            |
| `updated_at`           | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                         | Last update timestamp            |
| `created_at`           | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                         | Creation timestamp               |

Allowed values:

* `application_type`: `baru`, `perpanjangan`
* `approval_status`: `proses`, `approved`, `rejected`
* `payment_status`: `unpaid`, `proses`, `paid`, `rejected`
* `permit_status`: `draft`, `active`, `expired`, `terminated`

Important:

* `sector_id` and `stall_id` must belong to the selected `location_id`.
* This is enforced by `trg_validate_land_permit_location`.

---

## `land_permit_approval`

Stores approval steps for land permit applications.

| Column                       | Type          | Constraint / Default                               | Description                     |
| ---------------------------- | ------------- | -------------------------------------------------- | ------------------------------- |
| `id`                         | `SERIAL`      | `PRIMARY KEY`                                      | Approval ID                     |
| `land_permit_application_id` | `INTEGER`     | `NOT NULL REFERENCES land_permit_applications(id)` | Related land permit application |
| `approver_id`                | `INTEGER`     | `REFERENCES users(id)`                             | User who approved/rejected      |
| `role_id`                    | `INTEGER`     | `NOT NULL REFERENCES roles(id)`                    | Role responsible for this step  |
| `step_order`                 | `INTEGER`     | `NOT NULL`                                         | Approval step order             |
| `approved_at`                | `TIMESTAMP`   | nullable                                           | Approval/rejection timestamp    |
| `status`                     | `VARCHAR(20)` | `DEFAULT 'pending'`                                | Approval step status            |
| `notes`                      | `TEXT`        | nullable                                           | Approval/rejection notes        |
| `updated_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Last update timestamp           |
| `created_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Creation timestamp              |

Allowed `status` values:

* `pending`
* `approved`
* `rejected`

---

## `land_permit_payments`

Stores land permit full payment uploads.

| Column                       | Type            | Constraint / Default                               | Description                     |
| ---------------------------- | --------------- | -------------------------------------------------- | ------------------------------- |
| `id`                         | `SERIAL`        | `PRIMARY KEY`                                      | Payment ID                      |
| `land_permit_application_id` | `INTEGER`       | `NOT NULL REFERENCES land_permit_applications(id)` | Related land permit application |
| `payment_number`             | `INTEGER`       | `NOT NULL DEFAULT 1`                               | Payment number                  |
| `amount`                     | `NUMERIC(18,2)` | `NOT NULL DEFAULT 0`                               | Paid amount                     |
| `payment_date`               | `DATE`          | `NOT NULL`                                         | Payment date from trader        |
| `accounting_date`            | `DATE`          | nullable                                           | Accounting date from finance    |
| `proof_file_path`            | `TEXT`          | `NOT NULL`                                         | Uploaded payment proof path     |
| `uploaded_by`                | `INTEGER`       | `NOT NULL REFERENCES users(id)`                    | User who uploaded proof         |
| `approval_status`            | `VARCHAR(20)`   | `DEFAULT 'proses'`                                 | Finance approval status         |
| `notes`                      | `TEXT`          | nullable                                           | Notes                           |
| `updated_at`                 | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                        | Last update timestamp           |
| `created_at`                 | `TIMESTAMP`     | `DEFAULT CURRENT_TIMESTAMP`                        | Creation timestamp              |

Allowed `approval_status` values:

* `proses`
* `approved`
* `rejected`

---

## `land_permit_payment_approval`

Stores finance validation steps for land permit payments.

| Column                     | Type          | Constraint / Default                            | Description                     |
| -------------------------- | ------------- | ----------------------------------------------- | ------------------------------- |
| `id`                       | `SERIAL`      | `PRIMARY KEY`                                   | Payment approval ID             |
| `land_permit_payment_id`   | `INTEGER`     | `NOT NULL REFERENCES land_permit_payments(id)`  | Related land permit payment     |
| `role_id`                  | `INTEGER`     | `NOT NULL REFERENCES roles(id)`                 | Finance role                    |
| `step_order`               | `INTEGER`     | `NOT NULL DEFAULT 1`                            | Approval step order             |
| `status`                   | `VARCHAR(20)` | `DEFAULT 'pending'`                             | Approval status                 |
| `approver_id`              | `INTEGER`     | `REFERENCES users(id)`                          | User who approved/rejected      |
| `notes`                    | `TEXT`        | nullable                                        | Approval/rejection notes        |
| `proof_verified_file_path` | `TEXT`        | nullable                                        | Finance verification proof file |
| `approved_at`              | `TIMESTAMP`   | nullable                                        | Approval/rejection timestamp    |
| `updated_at`               | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                     | Last update timestamp           |
| `created_at`               | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                     | Creation timestamp              |

---

## `land_permit_terminations`

Stores land permit termination/nonactive requests.

| Column                       | Type          | Constraint / Default                               | Description                     |
| ---------------------------- | ------------- | -------------------------------------------------- | ------------------------------- |
| `id`                         | `SERIAL`      | `PRIMARY KEY`                                      | Termination ID                  |
| `land_permit_application_id` | `INTEGER`     | `NOT NULL REFERENCES land_permit_applications(id)` | Related land permit application |
| `reason`                     | `TEXT`        | `NOT NULL`                                         | Termination reason              |
| `statement_file_path`        | `TEXT`        | nullable                                           | Statement file path             |
| `processed_by`               | `INTEGER`     | `REFERENCES users(id)`                             | User who processed request      |
| `terminated_at`              | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Termination request timestamp   |
| `current_step`               | `INTEGER`     | `DEFAULT 1`                                        | Current approval step           |
| `approval_status`            | `VARCHAR(20)` | `DEFAULT 'proses'`                                 | Termination approval status     |
| `is_terminated`              | `BOOLEAN`     | `DEFAULT FALSE`                                    | Final terminated flag           |
| `updated_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Last update timestamp           |
| `created_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Creation timestamp              |

---

## `land_permit_termination_approval`

Stores approval steps for land permit termination.

| Column                       | Type          | Constraint / Default                               | Description                   |
| ---------------------------- | ------------- | -------------------------------------------------- | ----------------------------- |
| `id`                         | `SERIAL`      | `PRIMARY KEY`                                      | Termination approval ID       |
| `land_permit_termination_id` | `INTEGER`     | `NOT NULL REFERENCES land_permit_terminations(id)` | Related termination request   |
| `role_id`                    | `INTEGER`     | `NOT NULL REFERENCES roles(id)`                    | Role responsible for approval |
| `step_order`                 | `INTEGER`     | `NOT NULL`                                         | Approval step order           |
| `status`                     | `VARCHAR(20)` | `DEFAULT 'pending'`                                | Approval status               |
| `approver_id`                | `INTEGER`     | `REFERENCES users(id)`                             | User who approved/rejected    |
| `notes`                      | `TEXT`        | nullable                                           | Approval/rejection notes      |
| `approved_at`                | `TIMESTAMP`   | nullable                                           | Approval/rejection timestamp  |
| `updated_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Last update timestamp         |
| `created_at`                 | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`                        | Creation timestamp            |

---

## `land_permit_documents`

Stores land permit documents, trader cards, and QR validation tokens.

| Column                       | Type           | Constraint / Default                               | Description                     |
| ---------------------------- | -------------- | -------------------------------------------------- | ------------------------------- |
| `id`                         | `SERIAL`       | `PRIMARY KEY`                                      | Document ID                     |
| `land_permit_application_id` | `INTEGER`      | `NOT NULL REFERENCES land_permit_applications(id)` | Related land permit application |
| `document_type`              | `VARCHAR(40)`  | `NOT NULL`                                         | Document type                   |
| `document_number`            | `VARCHAR(100)` | nullable                                           | Document/card number            |
| `file_path`                  | `TEXT`         | nullable                                           | File path                       |
| `qr_token`                   | `VARCHAR(120)` | `UNIQUE`                                           | QR validation token             |
| `qr_generated_at`            | `TIMESTAMP`    | nullable                                           | QR generation timestamp         |
| `printed_at`                 | `TIMESTAMP`    | nullable                                           | Print timestamp                 |
| `printed_by`                 | `INTEGER`      | `REFERENCES users(id)`                             | User who printed document       |
| `status`                     | `VARCHAR(20)`  | `DEFAULT 'draft'`                                  | Document status                 |
| `notes`                      | `TEXT`         | nullable                                           | Notes                           |
| `updated_at`                 | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP`                        | Last update timestamp           |
| `created_at`                 | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP`                        | Creation timestamp              |

Allowed `document_type` values:

* `permit_document`
* `trader_card`
* `payment_proof`
* `statement`
* `other`

Allowed `status` values:

* `draft`
* `printed`
* `active`
* `void`

---

# Notification Tables

## `notifications`

Stores notification master records.

| Column        | Type           | Constraint / Default                      | Description                    |
| ------------- | -------------- | ----------------------------------------- | ------------------------------ |
| `id`          | `SERIAL`       | `PRIMARY KEY`                             | Notification ID                |
| `type`        | `VARCHAR(60)`  | `NOT NULL`                                | Notification type              |
| `title`       | `VARCHAR(160)` | `NOT NULL`                                | Notification title             |
| `message`     | `TEXT`         | `NOT NULL`                                | Notification message           |
| `entity_type` | `VARCHAR(60)`  | nullable                                  | Related entity type            |
| `entity_id`   | `INTEGER`      | nullable                                  | Related entity ID              |
| `action_url`  | `TEXT`         | nullable                                  | URL/action target              |
| `priority`    | `VARCHAR(20)`  | `NOT NULL DEFAULT 'normal'`               | Notification priority          |
| `metadata`    | `JSONB`        | `NOT NULL DEFAULT '{}'::jsonb`            | Additional metadata            |
| `created_by`  | `INTEGER`      | `REFERENCES users(id) ON DELETE SET NULL` | Actor who created notification |
| `created_at`  | `TIMESTAMP`    | `NOT NULL DEFAULT CURRENT_TIMESTAMP`      | Creation timestamp             |

Allowed `priority` values:

* `low`
* `normal`
* `high`
* `urgent`

Indexes:

* `type`
* `(entity_type, entity_id)`
* `created_at DESC`

Important:

* Notification data is shared through `notification_recipients`.
* Do not delete notification records for user clear/archive actions.

---

## `notification_recipients`

Stores user-specific notification state.

| Column            | Type        | Constraint / Default                                      | Description               |
| ----------------- | ----------- | --------------------------------------------------------- | ------------------------- |
| `id`              | `SERIAL`    | `PRIMARY KEY`                                             | Notification recipient ID |
| `notification_id` | `INTEGER`   | `NOT NULL REFERENCES notifications(id) ON DELETE CASCADE` | Related notification      |
| `user_id`         | `INTEGER`   | `NOT NULL REFERENCES users(id) ON DELETE CASCADE`         | Recipient user            |
| `role_id`         | `INTEGER`   | `REFERENCES roles(id) ON DELETE SET NULL`                 | Recipient role            |
| `read_at`         | `TIMESTAMP` | nullable                                                  | Read timestamp            |
| `archived_at`     | `TIMESTAMP` | nullable                                                  | Archive timestamp         |
| `created_at`      | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP`                      | Creation timestamp        |

Constraints:

* Unique `(notification_id, user_id)`

Indexes:

* `(user_id, archived_at, read_at, created_at DESC)`
* Partial unread index on `user_id` where `read_at IS NULL AND archived_at IS NULL`

Business rules:

* Use `archived_at` for clear/archive behavior.
* Use `read_at` for read state.
* Do not permanently delete notification records for clear actions.

---

# Document And Contract Tables

## `documents`

Stores uploaded document files.

| Column                  | Type          | Constraint / Default                | Description                                  |
| ----------------------- | ------------- | ----------------------------------- | -------------------------------------------- |
| `id`                    | `SERIAL`      | `PRIMARY KEY`                       | Document ID                                  |
| `tenant_application_id` | `INTEGER`     | `REFERENCES tenant_application(id)` | Related tenant application                   |
| `user_id`               | `INTEGER`     | `REFERENCES users(id)`              | Related user                                 |
| `doc_type`              | `VARCHAR(50)` | nullable                            | Document type, example: `ktp`, `bukti_bayar` |
| `file_path`             | `TEXT`        | `NOT NULL`                          | File path                                    |
| `uploaded_at`           | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Upload timestamp                             |
| `updated_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Last update timestamp                        |
| `created_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Creation timestamp                           |

---

## `contracts`

Stores generated contract documents.

| Column                  | Type          | Constraint / Default                | Description                |
| ----------------------- | ------------- | ----------------------------------- | -------------------------- |
| `id`                    | `SERIAL`      | `PRIMARY KEY`                       | Contract ID                |
| `tenant_application_id` | `INTEGER`     | `REFERENCES tenant_application(id)` | Related tenant application |
| `contract_number`       | `VARCHAR(50)` | `UNIQUE`                            | Contract number            |
| `contract_file_path`    | `TEXT`        | nullable                            | Contract file path         |
| `contract_date`         | `DATE`        | nullable                            | Contract date              |
| `updated_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Last update timestamp      |
| `created_at`            | `TIMESTAMP`   | `DEFAULT CURRENT_TIMESTAMP`         | Creation timestamp         |

---

# Database Functions

## `update_updated_at_column()`

Purpose:

* Automatically updates `updated_at` to `NOW()` before row update.

Used by triggers on tables that contain `updated_at`.

---

## `create_notification_for_roles(...)`

Purpose:

* Creates one notification record.
* Creates recipient rows for users whose `role_id` is included in `p_role_ids`.
* Avoids duplicate recipient rows using `ON CONFLICT (notification_id, user_id) DO NOTHING`.

Parameters:

| Parameter       | Type        | Description                |
| --------------- | ----------- | -------------------------- |
| `p_type`        | `VARCHAR`   | Notification type          |
| `p_title`       | `VARCHAR`   | Notification title         |
| `p_message`     | `TEXT`      | Notification message       |
| `p_entity_type` | `VARCHAR`   | Related entity type        |
| `p_entity_id`   | `INTEGER`   | Related entity ID          |
| `p_action_url`  | `TEXT`      | Action URL                 |
| `p_priority`    | `VARCHAR`   | Priority                   |
| `p_created_by`  | `INTEGER`   | Creator user ID            |
| `p_role_ids`    | `INTEGER[]` | Recipient role IDs         |
| `p_metadata`    | `JSONB`     | Metadata, defaults to `{}` |

Returns:

* Created notification ID.

---

## `validate_room_location()`

Purpose:

* Validates that `tenant_application.room_id` belongs to `tenant_application.location_id`.

Behavior:

* Looks up `rooms.location_id`.
* Raises exception when room does not exist.
* Raises exception when room location does not match selected location.
* Runs before insert or update on `tenant_application`.

---

## `validate_land_permit_location()`

Purpose:

* Validates that the selected land permit sector and stall belong to the selected
  location.
* Validates that the selected stall belongs to the selected sector.

Behavior:

* Looks up `land_sectors.location_id`.
* Looks up `land_stalls.location_id` and `land_stalls.sector_id`.
* Raises exception when sector or stall does not exist.
* Raises exception when sector, stall, and location do not match.
* Runs before insert or update on `land_permit_applications`.

---

# Triggers

## Auto-update `updated_at`

The following tables have `BEFORE UPDATE` triggers that call `update_updated_at_column()`:

* `locations`
* `rooms`
* `roles`
* `users`
* `location_floor_prices`
* `tenant_application`
* `tenant_approval`
* `tenant_early_terminations`
* `tenant_termination_approval`
* `payments`
* `payment_approval`
* `documents`
* `contracts`
* `tenant_identities`
* `payment_receipts`
* `land_sectors`
* `land_stalls`
* `land_permit_applications`
* `land_permit_approval`
* `land_permit_payments`
* `land_permit_payment_approval`
* `land_permit_terminations`
* `land_permit_termination_approval`
* `land_permit_documents`

## Room-location validation

Trigger:

* `trg_validate_room_location`

Table:

* `tenant_application`

Timing:

* `BEFORE INSERT OR UPDATE`

Function:

* `validate_room_location()`

Purpose:

* Prevents creating/updating tenant applications where selected room does not belong to selected location.

---

## Land permit location validation

Trigger:

* `trg_validate_land_permit_location`

Table:

* `land_permit_applications`

Timing:

* `BEFORE INSERT OR UPDATE`

Function:

* `validate_land_permit_location()`

Purpose:

* Prevents creating/updating land permit applications where selected sector or
  stall does not belong to the selected location.
* Prevents selecting a stall that does not belong to the selected sector.

---

# Relationship Overview

## Location And Room

```text
locations
  └── location_floor_prices
        └── rooms
```

Main foreign keys:

* `location_floor_prices.location_id → locations.id`
* `rooms.location_id → locations.id`
* `rooms.floor_id → location_floor_prices.id`

---

## Tenant Application

```text
users
tenant_identities
locations
rooms
  └── tenant_application
```

Main foreign keys:

* `tenant_application.user_id → users.id`
* `tenant_application.tenant_identity_id → tenant_identities.id`
* `tenant_application.location_id → locations.id`
* `tenant_application.room_id → rooms.id`
* `tenant_application.renewal_of → tenant_application.id`

---

## Tenant Approval

```text
tenant_application
roles
users
  └── tenant_approval
```

Main foreign keys:

* `tenant_approval.tenant_application_id → tenant_application.id`
* `tenant_approval.role_id → roles.id`
* `tenant_approval.approver_id → users.id`

---

## Early Termination

```text
tenant_application
  └── tenant_early_terminations
        └── tenant_termination_approval
```

Main foreign keys:

* `tenant_early_terminations.tenant_application_id → tenant_application.id`
* `tenant_early_terminations.processed_by → users.id`
* `tenant_termination_approval.tenant_early_termination_id → tenant_early_terminations.id`
* `tenant_termination_approval.role_id → roles.id`
* `tenant_termination_approval.approver_id → users.id`

---

## Payment

```text
tenant_application
  └── payments
        ├── payment_approval
        └── payment_receipts
```

Main foreign keys:

* `payments.tenant_application_id → tenant_application.id`
* `payments.uploaded_by → users.id`
* `payment_approval.payment_id → payments.id`
* `payment_approval.role_id → roles.id`
* `payment_approval.approver_id → users.id`
* `payment_receipts.payment_id → payments.id`
* `payment_receipts.printed_by → users.id`
* `payment_receipts.approved_by → users.id`

---

## Notifications

```text
notifications
  └── notification_recipients
```

Main foreign keys:

* `notifications.created_by → users.id`
* `notification_recipients.notification_id → notifications.id`
* `notification_recipients.user_id → users.id`
* `notification_recipients.role_id → roles.id`

---

## Land Permit

```text
locations
  -> land_sectors
       -> land_stalls

tenant_identities
  -> land_permit_applications

users
locations
land_sectors
land_stalls
  -> land_permit_applications
       -> land_permit_approval
       -> land_permit_payments
            -> land_permit_payment_approval
       -> land_permit_terminations
            -> land_permit_termination_approval
       -> land_permit_documents
```

Main foreign keys:

* `land_sectors.location_id -> locations.id`
* `land_stalls.location_id -> locations.id`
* `land_stalls.sector_id -> land_sectors.id`
* `land_permit_applications.user_id -> users.id`
* `land_permit_applications.tenant_identity_id -> tenant_identities.id`
* `land_permit_applications.location_id -> locations.id`
* `land_permit_applications.sector_id -> land_sectors.id`
* `land_permit_applications.stall_id -> land_stalls.id`
* `land_permit_applications.renewal_of -> land_permit_applications.id`
* `land_permit_approval.land_permit_application_id -> land_permit_applications.id`
* `land_permit_payments.land_permit_application_id -> land_permit_applications.id`
* `land_permit_payment_approval.land_permit_payment_id -> land_permit_payments.id`
* `land_permit_terminations.land_permit_application_id -> land_permit_applications.id`
* `land_permit_termination_approval.land_permit_termination_id -> land_permit_terminations.id`
* `land_permit_documents.land_permit_application_id -> land_permit_applications.id`

---

## Documents And Contracts

```text
tenant_application
  ├── documents
  └── contracts
```

Main foreign keys:

* `documents.tenant_application_id → tenant_application.id`
* `documents.user_id → users.id`
* `contracts.tenant_application_id → tenant_application.id`

---

# Important Status Values

## Room Status

* `available`
* `occupied`
* `unavailable`
* `maintenance`

## Tenant Identity Status

* `active`
* `inactive`
* `blacklisted`

## Tenant Application Payment Type

* `lunas`
* `cicilan`

## Tenant Approval Status

* `pending`
* `approved`
* `rejected`

## Tenant Application Approval Status

* `proses`
* `approved`
* `rejected`

## Termination Approval Status

* `proses`
* `approved`
* `rejected`

## Payment Approval Status

* `proses`
* `approved`
* `rejected`

Important:

* The current `payments.approval_status` default is `pending`, but allowed check values are `proses`, `approved`, and `rejected`.
* Verify the live database before changing payment approval behavior.

## Payment Approval Step Status

* `pending`
* `approved`
* `rejected`

## Payment Receipt Type

* `contract`
* `pph`

## Payment Receipt Status

* `draft`
* `printed`
* `approved`
* `rejected`
* `void`

## Land Sector Status

* `active`
* `inactive`

## Land Stall Status

* `available`
* `occupied`
* `unavailable`
* `maintenance`

## Land Permit Identity Status

* `active`
* `inactive`
* `blacklisted`

## Land Permit Application Type

* `baru`
* `perpanjangan`

## Land Permit Approval Status

* `proses`
* `approved`
* `rejected`

## Land Permit Step Status

* `pending`
* `approved`
* `rejected`

## Land Permit Payment Status

* `unpaid`
* `proses`
* `paid`
* `rejected`

## Land Permit Status

* `draft`
* `active`
* `expired`
* `terminated`

## Land Permit Document Type

* `permit_document`
* `trader_card`
* `payment_proof`
* `statement`
* `other`

## Land Permit Document Status

* `draft`
* `printed`
* `active`
* `void`

## Notification Priority

* `low`
* `normal`
* `high`
* `urgent`

---

# Query And Implementation Notes

When writing database queries:

* Use explicit column lists.
* Avoid `SELECT *`.
* Use parameterized queries.
* Scope queries by user role/access when needed.
* Validate IDs before querying.
* Validate entity ownership/relationship before mutations.
* Use transactions for approval, payment, receipt, contract, notification, and termination flows.
* Keep room rental and land permit queries scoped to their own transaction
  tables. Do not join or mutate room rental tables for land permit workflows
  unless a feature explicitly needs read-only shared master data.
* For land permit notifications, use land permit entity types and
  `metadata.module = 'land_permit'` so recipients do not receive notifications
  from the wrong module.
* Do not trust frontend-provided actor fields such as:

  * `user_id`
  * `approver_id`
  * `processed_by`
  * `created_by`
  * `updated_by`
  * `uploaded_by`
  * `printed_by`
  * `approved_by`

Actor identity must come from authenticated session.

---

# Schema Change Rules

Before suggesting schema changes:

* Explain why the change is needed.
* Explain affected tables.
* Explain affected APIs.
* Explain affected UI pages.
* Explain backward compatibility impact.
* Provide PostgreSQL migration SQL.
* Keep schema migrations separate from UI-only work unless explicitly requested.
