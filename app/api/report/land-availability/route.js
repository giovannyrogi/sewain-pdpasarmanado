import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const REPORT_ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];

const STATUS_KEYS = ["available", "occupied", "maintenance", "unavailable"];

const formatDateTime = (value) =>
  value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : null;

const formatDate = (value) =>
  value ? moment(value).format("YYYY-MM-DD") : null;

const buildSummary = (rows = []) => {
  const statusSummary = STATUS_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: rows.filter((row) => row.status === key).length,
    }),
    {},
  );

  return {
    total: rows.length,
    ...statusSummary,
    locations: new Set(rows.map((row) => row.location_id).filter(Boolean)).size,
    sectors: new Set(rows.map((row) => row.sector_id).filter(Boolean)).size,
  };
};

const mapLandAvailabilityRow = (row) => ({
  id: row.stall_id,
  stall_id: row.stall_id,
  location_id: row.location_id,
  location_name: row.location_name,
  location_code: row.location_code,
  sector_id: row.sector_id,
  sector_name: row.sector_name,
  sector_code: row.sector_code,
  stall_number: row.stall_number,
  stall_length: row.stall_length,
  stall_width: row.stall_width,
  stall_area: row.stall_area,
  price_per_m2: row.price_per_m2,
  status: row.status,
  notes: row.notes,
  used_by: row.used_by,
  used_by_nik: row.used_by_nik,
  used_document_number: row.used_document_number,
  used_start_date: formatDate(row.used_start_date),
  used_end_date: formatDate(row.used_end_date),
  commodity_type: row.commodity_type,
  updated_at: formatDateTime(row.updated_at),
  created_at: formatDateTime(row.created_at),
});

export async function GET() {
  try {
    const { response } = await requireRole(REPORT_ACCESS_ROLES);
    if (response) return response;

    const result = await pool.query(
      `
      WITH final_terminations AS (
        SELECT land_permit_application_id
        FROM land_permit_terminations
        WHERE approval_status = 'approved'
          AND is_terminated = true
      )
      SELECT
        stall.id AS stall_id,
        stall.location_id,
        location.location_name,
        location.location_code,
        stall.sector_id,
        sector.sector_name,
        sector.sector_code,
        stall.stall_number,
        stall.stall_length,
        stall.stall_width,
        stall.stall_area,
        stall.price_per_m2,
        stall.status,
        stall.notes,
        stall.updated_at,
        stall.created_at,
        active_permit.tenant_name AS used_by,
        active_permit.tenant_nik AS used_by_nik,
        active_permit.document_number AS used_document_number,
        active_permit.start_date AS used_start_date,
        active_permit.end_date AS used_end_date,
        active_permit.commodity_type
      FROM land_stalls stall
      JOIN locations location ON location.id = stall.location_id
      JOIN land_sectors sector ON sector.id = stall.sector_id
      LEFT JOIN LATERAL (
        SELECT
          identity.full_name AS tenant_name,
          identity.nik AS tenant_nik,
          document.document_number,
          application.start_date,
          application.end_date,
          application.commodity_type
        FROM land_permit_applications application
        JOIN tenant_identities identity
          ON identity.id = application.tenant_identity_id
        LEFT JOIN final_terminations termination
          ON termination.land_permit_application_id = application.id
        LEFT JOIN LATERAL (
          SELECT doc.document_number
          FROM land_permit_documents doc
          WHERE doc.land_permit_application_id = application.id
            AND doc.document_type = 'permit_document'
          ORDER BY doc.created_at DESC, doc.id DESC
          LIMIT 1
        ) document ON TRUE
        WHERE application.stall_id = stall.id
          AND application.approval_status = 'approved'
          AND COALESCE(application.permit_status, 'active') <> 'terminated'
          AND termination.land_permit_application_id IS NULL
          AND application.start_date::date <= CURRENT_DATE
          AND application.end_date::date >= CURRENT_DATE
        ORDER BY application.end_date DESC, application.id DESC
        LIMIT 1
      ) active_permit ON TRUE
      ORDER BY
        location.location_name ASC,
        sector.sector_name ASC,
        stall.stall_number ASC
      `,
    );

    const rows = result.rows.map(mapLandAvailabilityRow);

    return Response.json({
      success: true,
      message: "Berhasil mengambil laporan ketersediaan lahan.",
      data: rows,
      summary: buildSummary(rows),
    });
  } catch (error) {
    console.error("Error fetching land availability report:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil laporan ketersediaan lahan.",
      },
      { status: 500 },
    );
  }
}
