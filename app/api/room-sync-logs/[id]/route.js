import { NextResponse } from "next/server";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Detail satu run sinkronisasi beserta item ruangan yang dilepas/dilewati.
 */
export async function GET(_request, { params }) {
  const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
  if (response) return response;

  const { id } = await params;

  if (!UUID_PATTERN.test(String(id || ""))) {
    return NextResponse.json(
      { success: false, message: "ID log sinkronisasi tidak valid." },
      { status: 400 },
    );
  }

  try {
    const runResult = await pool.query(
      `
        SELECT
          r.id,
          r.trigger_source,
          r.status,
          r.started_at,
          r.finished_at,
          r.executed_by,
          u.full_name AS executed_by_name,
          r.total_checked,
          r.total_released,
          r.total_skipped,
          r.error_message
        FROM room_status_sync_runs r
        LEFT JOIN users u ON u.id = r.executed_by
        WHERE r.id = $1
      `,
      [id],
    );

    if (!runResult.rowCount) {
      return NextResponse.json(
        { success: false, message: "Log sinkronisasi tidak ditemukan." },
        { status: 404 },
      );
    }

    const itemsResult = await pool.query(
      `
        SELECT
          id,
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
          details,
          created_at
        FROM room_status_sync_items
        WHERE run_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [id],
    );

    return NextResponse.json({
      success: true,
      data: {
        run: runResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil detail log sinkronisasi ruangan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil detail log sinkronisasi ruangan.",
      },
      { status: 500 },
    );
  }
}
