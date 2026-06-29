import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const REPORT_ACCESS_ROLES = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_KEYS = ["available", "occupied", "maintenance", "unavailable"];

const formatDateTime = (value) =>
  value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : null;

const buildSummary = (rows = []) => {
  const base = STATUS_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: rows.filter((row) => row.status === key).length,
    }),
    {},
  );

  return {
    total: rows.length,
    ...base,
    locations: new Set(rows.map((row) => row.location_id).filter(Boolean)).size,
    floors: new Set(rows.map((row) => row.floor_id).filter(Boolean)).size,
  };
};

const mapRoomAvailabilityRow = (row) => ({
  id: row.room_id,
  room_id: row.room_id,
  location_id: row.location_id,
  location_name: row.location_name,
  location_code: row.location_code,
  room_number: row.room_number,
  floor_id: row.floor_id,
  room_floor: row.room_floor,
  room_length: row.room_length,
  room_width: row.room_width,
  room_area: row.room_area,
  price_per_m2: row.price_per_m2,
  price_type: row.price_type,
  status: row.status,
  notes: row.notes,
  used_by: row.used_by,
  used_by_nik: row.used_by_nik,
  used_document_number: row.used_document_number,
  used_contract_number: row.used_contract_number,
  used_start_date: row.used_start_date
    ? moment(row.used_start_date).format("YYYY-MM-DD")
    : null,
  used_end_date: row.used_end_date
    ? moment(row.used_end_date).format("YYYY-MM-DD")
    : null,
  updated_at: formatDateTime(row.updated_at),
  created_at: formatDateTime(row.created_at),
});

/**
 * Laporan ketersediaan ruangan adalah kondisi master ruangan saat ini.
 * Akses mengikuti laporan sewa ruangan dan tidak dibuka untuk Admin Izin Lahan.
 */
export async function GET() {
  try {
    const { response } = await requireRole(REPORT_ACCESS_ROLES);
    if (response) return response;

    const result = await pool.query(
      `
      WITH final_terminations AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved'
          AND is_terminated = true
      )
      SELECT
        r.id AS room_id,
        r.location_id,
        l.location_name,
        l.location_code,
        r.room_number,
        r.floor_id,
        f.floor AS room_floor,
        r.room_length,
        r.room_width,
        r.room_area,
        r.price_per_m2,
        r.price_type,
        r.status,
        r.notes,
        r.updated_at,
        r.created_at,
        active_lease.tenant_name AS used_by,
        active_lease.tenant_nik AS used_by_nik,
        active_lease.document_number AS used_document_number,
        active_lease.contract_number AS used_contract_number,
        active_lease.start_date AS used_start_date,
        active_lease.end_date AS used_end_date
      FROM rooms r
      JOIN locations l ON l.id = r.location_id
      LEFT JOIN location_floor_prices f ON f.id = r.floor_id
      LEFT JOIN LATERAL (
        SELECT
          ti.full_name AS tenant_name,
          ti.nik AS tenant_nik,
          ta.document_number,
          latest_contract.contract_number,
          ta.start_date,
          ta.end_date
        FROM tenant_application ta
        JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        LEFT JOIN final_terminations ft ON ft.tenant_application_id = ta.id
        LEFT JOIN LATERAL (
          SELECT c.contract_number
          FROM contracts c
          WHERE c.tenant_application_id = ta.id
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT 1
        ) latest_contract ON TRUE
        WHERE ta.room_id = r.id
          AND ta.approval_status = 'approved'
          AND ft.tenant_application_id IS NULL
          AND ta.start_date::date <= CURRENT_DATE
          AND ta.end_date::date >= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
              AND child.approval_status = 'approved'
          )
        ORDER BY ta.end_date DESC, ta.id DESC
        LIMIT 1
      ) active_lease ON TRUE
      ORDER BY
        l.location_name ASC,
        f.floor ASC NULLS LAST,
        r.room_number ASC
      `,
    );

    const rows = result.rows.map(mapRoomAvailabilityRow);

    return Response.json({
      success: true,
      message: "Berhasil mengambil laporan ketersediaan ruangan.",
      data: rows,
      summary: buildSummary(rows),
    });
  } catch (error) {
    console.error("Error fetching room availability report:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil laporan ketersediaan ruangan.",
      },
      { status: 500 },
    );
  }
}
