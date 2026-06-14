import { randomUUID } from "node:crypto";
import pool from "@/lib/dbConfig";

const ROOM_SYNC_LOCK_KEY = 26061301;
const BUSINESS_TIMEZONE = "Asia/Makassar";

const TRIGGER_SOURCES = new Set(["cron", "manual"]);

const normalizeTriggerSource = (triggerSource) =>
  TRIGGER_SOURCES.has(triggerSource) ? triggerSource : "manual";

const buildItemDetails = (row) => ({
  business_timezone: BUSINESS_TIMEZONE,
  business_date: row.business_date,
  has_blocking_application: row.has_blocking_application,
  has_blocking_renewal: row.has_blocking_renewal,
  final_termination_id: row.final_termination_id,
});

const getSkipReason = (row) => {
  if (row.has_blocking_renewal) {
    return "Ruangan memiliki perpanjangan aktif, sehingga status tetap ditahan.";
  }

  if (row.has_blocking_application) {
    return "Ruangan masih memiliki permohonan aktif, sehingga status tetap ditahan.";
  }

  return null;
};

const insertRunItem = async (client, runId, row, action, reason, newStatus) => {
  await client.query(
    `
      INSERT INTO room_status_sync_items (
        run_id,
        room_id,
        tenant_application_id,
        contract_id,
        tenant_name,
        location_name,
        room_number,
        document_number,
        contract_number,
        lease_start_date,
        lease_end_date,
        previous_status,
        new_status,
        action,
        reason,
        details
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16::jsonb
      )
    `,
    [
      runId,
      row.room_id,
      row.tenant_application_id,
      row.contract_id,
      row.tenant_name,
      row.location_name,
      row.room_number,
      row.document_number,
      row.contract_number,
      row.lease_start_date,
      row.lease_end_date,
      row.previous_status,
      newStatus,
      action,
      reason,
      JSON.stringify(buildItemDetails(row)),
    ],
  );
};

const createFailedRunLog = async ({ runId, triggerSource, executedBy, error }) => {
  try {
    await pool.query(
      `
        INSERT INTO room_status_sync_runs (
          id,
          trigger_source,
          status,
          started_at,
          finished_at,
          executed_by,
          error_message
        )
        VALUES ($1, $2, 'failed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          status = 'failed',
          finished_at = CURRENT_TIMESTAMP,
          error_message = EXCLUDED.error_message
      `,
      [
        runId,
        triggerSource,
        executedBy,
        error?.message || "Gagal menjalankan sinkronisasi status ruangan.",
      ],
    );
  } catch (logError) {
    console.error("Gagal menyimpan log error sinkronisasi ruangan:", logError);
  }
};

/**
 * Satu-satunya helper untuk melepas status room yang masa sewanya sudah selesai.
 *
 * Helper ini sengaja tidak dipanggil dari dashboard atau API list biasa agar
 * perubahan status room selalu punya audit trail dari cron atau tombol manual.
 */
export async function syncExpiredRooms({
  triggerSource = "manual",
  executedBy = null,
} = {}) {
  const normalizedSource = normalizeTriggerSource(triggerSource);
  const runId = randomUUID();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO room_status_sync_runs (
          id,
          trigger_source,
          status,
          started_at,
          executed_by
        )
        VALUES ($1, $2, 'running', CURRENT_TIMESTAMP, $3)
      `,
      [runId, normalizedSource, executedBy],
    );

    const lockResult = await client.query(
      "SELECT pg_try_advisory_xact_lock($1) AS locked",
      [ROOM_SYNC_LOCK_KEY],
    );

    if (!lockResult.rows[0]?.locked) {
      await client.query(
        `
          UPDATE room_status_sync_runs
          SET
            status = 'skipped',
            finished_at = CURRENT_TIMESTAMP,
            error_message = 'Sinkronisasi lain sedang berjalan.'
          WHERE id = $1
        `,
        [runId],
      );
      await client.query("COMMIT");

      return {
        success: true,
        alreadyRunning: true,
        runId,
        totalChecked: 0,
        totalReleased: 0,
        totalSkipped: 0,
        message: "Sinkronisasi lain sedang berjalan.",
      };
    }

    const candidates = await client.query(
      `
        WITH business_today AS (
          SELECT (NOW() AT TIME ZONE $1)::date AS today
        )
        SELECT
          bt.today AS business_date,
          r.id AS room_id,
          r.status AS previous_status,
          r.room_number,
          l.location_name,
          expired_ta.id AS tenant_application_id,
          expired_ta.document_number,
          expired_ta.start_date AS lease_start_date,
          expired_ta.end_date AS lease_end_date,
          expired_ta.final_termination_id,
          ti.full_name AS tenant_name,
          latest_contract.id AS contract_id,
          latest_contract.contract_number,
          EXISTS (
            SELECT 1
            FROM tenant_application active_ta
            LEFT JOIN tenant_early_terminations active_tet
              ON active_tet.tenant_application_id = active_ta.id
             AND active_tet.approval_status = 'approved'
             AND active_tet.is_terminated = true
            WHERE active_ta.room_id = r.id
              AND active_ta.id <> expired_ta.id
              AND active_ta.approval_status IN ('proses', 'approved')
              AND active_tet.id IS NULL
              AND (
                active_ta.end_date IS NULL
                OR active_ta.end_date::date >= bt.today
              )
          ) AS has_blocking_application,
          EXISTS (
            SELECT 1
            FROM tenant_application renewal_ta
            LEFT JOIN tenant_early_terminations renewal_tet
              ON renewal_tet.tenant_application_id = renewal_ta.id
             AND renewal_tet.approval_status = 'approved'
             AND renewal_tet.is_terminated = true
            WHERE renewal_ta.renewal_of = expired_ta.id
              AND renewal_ta.approval_status IN ('proses', 'approved')
              AND renewal_tet.id IS NULL
              AND (
                renewal_ta.end_date IS NULL
                OR renewal_ta.end_date::date >= bt.today
              )
          ) AS has_blocking_renewal
        FROM rooms r
        CROSS JOIN business_today bt
        JOIN LATERAL (
          SELECT
            ta.*,
            tet.id AS final_termination_id
          FROM tenant_application ta
          LEFT JOIN tenant_early_terminations tet
            ON tet.tenant_application_id = ta.id
           AND tet.approval_status = 'approved'
           AND tet.is_terminated = true
          WHERE ta.room_id = r.id
            AND ta.approval_status = 'approved'
            AND ta.document_number IS NOT NULL
            AND ta.end_date IS NOT NULL
            AND (
              ta.end_date::date < bt.today
              OR tet.id IS NOT NULL
            )
          ORDER BY
            CASE WHEN tet.id IS NOT NULL THEN 0 ELSE 1 END,
            ta.end_date DESC,
            ta.id DESC
          LIMIT 1
        ) expired_ta ON TRUE
        LEFT JOIN tenant_identities ti ON ti.id = expired_ta.tenant_identity_id
        LEFT JOIN locations l ON l.id = r.location_id
        LEFT JOIN LATERAL (
          SELECT c.id, c.contract_number
          FROM contracts c
          WHERE c.tenant_application_id = expired_ta.id
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT 1
        ) latest_contract ON TRUE
        WHERE r.status = 'occupied'
        ORDER BY expired_ta.end_date ASC, r.id ASC
      `,
      [BUSINESS_TIMEZONE],
    );

    let totalReleased = 0;
    let totalSkipped = 0;

    for (const row of candidates.rows) {
      const skipReason = getSkipReason(row);

      if (skipReason) {
        totalSkipped += 1;
        await insertRunItem(
          client,
          runId,
          row,
          "skipped",
          skipReason,
          row.previous_status,
        );
        continue;
      }

      const updateResult = await client.query(
        `
          UPDATE rooms
          SET
            status = 'available',
            notes = $2,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
            AND status = 'occupied'
          RETURNING id
        `,
        [
          row.room_id,
          "Ruangan tersedia kembali otomatis karena masa kontrak sudah berakhir atau termination final disetujui.",
        ],
      );

      if (updateResult.rowCount > 0) {
        totalReleased += 1;
        await insertRunItem(
          client,
          runId,
          row,
          "released",
          "Ruangan dibuat tersedia kembali karena tidak ada kontrak, perpanjangan, atau permohonan aktif yang menahan status.",
          "available",
        );
      } else {
        totalSkipped += 1;
        await insertRunItem(
          client,
          runId,
          row,
          "skipped",
          "Status ruangan berubah sebelum proses update dijalankan.",
          row.previous_status,
        );
      }
    }

    await client.query(
      `
        UPDATE room_status_sync_runs
        SET
          status = 'completed',
          finished_at = CURRENT_TIMESTAMP,
          total_checked = $2,
          total_released = $3,
          total_skipped = $4
        WHERE id = $1
      `,
      [runId, candidates.rowCount, totalReleased, totalSkipped],
    );

    await client.query("COMMIT");

    return {
      success: true,
      alreadyRunning: false,
      runId,
      totalChecked: candidates.rowCount,
      totalReleased,
      totalSkipped,
      message: `Sinkronisasi selesai. ${totalReleased} ruangan tersedia kembali.`,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error sinkronisasi status ruangan:", error);
    await createFailedRunLog({
      runId,
      triggerSource: normalizedSource,
      executedBy,
      error,
    });
    throw error;
  } finally {
    client.release();
  }
}
