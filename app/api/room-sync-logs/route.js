import { NextResponse } from "next/server";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const SUPERADMIN_ROLE_ID = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const parsePagination = (request) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );
  const search = String(searchParams.get("search") || "").trim();

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    search,
  };
};

/**
 * Daftar riwayat sinkronisasi status ruangan.
 * Akses dibatasi untuk superadmin karena data ini berisi audit operasional.
 */
export async function GET(request) {
  const { response } = await requireRole([SUPERADMIN_ROLE_ID]);
  if (response) return response;

  const { page, limit, offset, search } = parsePagination(request);
  const values = [];
  let whereClause = "";

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    whereClause = `
      WHERE LOWER(r.trigger_source) LIKE $1
         OR LOWER(r.status) LIKE $1
         OR LOWER(COALESCE(u.full_name, '')) LIKE $1
    `;
  }

  try {
    const countResult = await pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM room_status_sync_runs r
        LEFT JOIN users u ON u.id = r.executed_by
        ${whereClause}
      `,
      values,
    );

    const queryValues = [...values, limit, offset];
    const limitIndex = queryValues.length - 1;
    const offsetIndex = queryValues.length;

    const result = await pool.query(
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
          r.error_message,
          COUNT(i.id)::int AS item_count
        FROM room_status_sync_runs r
        LEFT JOIN users u ON u.id = r.executed_by
        LEFT JOIN room_status_sync_items i ON i.run_id = r.id
        ${whereClause}
        GROUP BY r.id, u.full_name
        ORDER BY r.started_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `,
      queryValues,
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil log sinkronisasi ruangan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil log sinkronisasi ruangan." },
      { status: 500 },
    );
  }
}
