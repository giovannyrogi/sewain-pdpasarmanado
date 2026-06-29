import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const DUE_PAYMENT_DAYS = 30;
const REPORT_ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];

const toDateString = (value) =>
  value ? moment(value).format("YYYY-MM-DD") : null;

const getSafeDateRange = (request) => {
  const { searchParams } = new URL(request.url);
  const today = moment().startOf("day");
  const defaultStartDate = moment("2000-01-01");
  const defaultEndDate = today.clone().add(DUE_PAYMENT_DAYS, "days");
  const parsedStartDate = moment(
    searchParams.get("start_date"),
    "YYYY-MM-DD",
    true,
  );
  const parsedEndDate = moment(searchParams.get("end_date"), "YYYY-MM-DD", true);
  const startDate = parsedStartDate.isValid() ? parsedStartDate : defaultStartDate;
  const endDate = parsedEndDate.isValid() ? parsedEndDate : defaultEndDate;

  if (startDate.isAfter(endDate)) {
    return {
      startDate: endDate.format("YYYY-MM-DD"),
      endDate: startDate.format("YYYY-MM-DD"),
    };
  }

  return {
    startDate: startDate.format("YYYY-MM-DD"),
    endDate: endDate.format("YYYY-MM-DD"),
  };
};

/**
 * Laporan jatuh tempo pembayaran izin lahan memakai tanggal mulai izin sebagai
 * acuan kewajiban pembayaran, sama seperti ringkasan dashboard izin lahan.
 */
export async function GET(request) {
  try {
    const { response } = await requireRole(REPORT_ACCESS_ROLES);
    if (response) return response;

    const { startDate, endDate } = getSafeDateRange(request);

    const result = await pool.query(
      `
      WITH final_terminations AS (
        SELECT land_permit_application_id
        FROM land_permit_terminations
        WHERE approval_status = 'approved'
          AND is_terminated = true
      ),
      classified AS (
        SELECT
          app.id AS land_permit_application_id,
          app.application_type,
          app.commodity_type,
          app.start_date,
          app.end_date,
          app.lease_duration_years,
          app.annual_land_rent,
          app.total_payment_land,
          app.total_payment,
          app.approval_status,
          app.current_step,
          app.payment_status,
          app.is_fully_paid,
          app.permit_status,
          app.created_at,
          app.updated_at,

          identity.id AS tenant_identity_id,
          identity.full_name AS tenant_name,
          identity.nik AS tenant_nik,
          identity.phone AS tenant_phone,
          identity.birth_place,
          identity.birth_date,
          identity.nationality,
          identity.religion,
          identity.occupation,
          identity.street_address,
          identity.rt,
          identity.rw,
          identity.kelurahan,
          identity.district,
          identity.city,
          identity.province,
          identity.ktp_file_path,
          identity.profile_photo_file_path,
          identity.land_permit_status,
          identity.land_permit_status_notes,

          location.id AS location_id,
          location.location_name,

          sector.id AS sector_id,
          sector.sector_name,
          sector.sector_code,

          stall.id AS stall_id,
          stall.stall_number,
          stall.stall_length,
          stall.stall_width,
          stall.stall_area,
          stall.price_per_m2,

          (app.start_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN app.start_date::date < CURRENT_DATE THEN 'overdue'
            ELSE 'dueSoon'
          END AS due_status
        FROM land_permit_applications app
        JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
        JOIN locations location ON location.id = app.location_id
        JOIN land_sectors sector ON sector.id = app.sector_id
        JOIN land_stalls stall ON stall.id = app.stall_id
        LEFT JOIN final_terminations ft
          ON ft.land_permit_application_id = app.id
        WHERE app.approval_status = 'approved'
          AND app.start_date IS NOT NULL
          AND app.permit_status <> 'terminated'
          AND ft.land_permit_application_id IS NULL
          AND (
            app.payment_status <> 'paid'
            OR COALESCE(app.is_fully_paid, false) = false
          )
          AND NOT EXISTS (
            SELECT 1
            FROM land_permit_payments payment
            WHERE payment.land_permit_application_id = app.id
              AND payment.approval_status IN ('proses', 'approved')
          )
          AND NOT EXISTS (
            SELECT 1
            FROM land_permit_applications child
            WHERE child.renewal_of = app.id
              AND child.approval_status = 'approved'
          )
          AND app.start_date::date BETWEEN $1::date AND $2::date
          AND (
            app.start_date::date < CURRENT_DATE
            OR app.start_date::date <= CURRENT_DATE + ($3::int * INTERVAL '1 day')
          )
      )
      SELECT *
      FROM classified
      ORDER BY
        CASE WHEN due_status = 'overdue' THEN 0 ELSE 1 END,
        CASE WHEN due_status = 'overdue' THEN start_date END DESC,
        CASE WHEN due_status = 'dueSoon' THEN start_date END ASC,
        land_permit_application_id DESC
      `,
      [startDate, endDate, DUE_PAYMENT_DAYS],
    );

    const rows = result.rows.map((row) => ({
      id: `land-permit-payment-due-${row.land_permit_application_id}`,
      land_permit_application_id: row.land_permit_application_id,
      tenant_identity_id: row.tenant_identity_id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      birth_place: row.birth_place,
      birth_date: toDateString(row.birth_date),
      nationality: row.nationality,
      religion: row.religion,
      occupation: row.occupation,
      street_address: row.street_address,
      rt: row.rt,
      rw: row.rw,
      kelurahan: row.kelurahan,
      district: row.district,
      city: row.city,
      province: row.province,
      ktp_file_path: row.ktp_file_path,
      profile_photo_file_path: row.profile_photo_file_path,
      land_permit_status: row.land_permit_status,
      land_permit_status_notes: row.land_permit_status_notes,
      application_type: row.application_type,
      commodity_type: row.commodity_type,
      location_id: row.location_id,
      location_name: row.location_name,
      sector_id: row.sector_id,
      sector_name: row.sector_name,
      sector_code: row.sector_code,
      stall_id: row.stall_id,
      stall_number: row.stall_number,
      stall_length: row.stall_length,
      stall_width: row.stall_width,
      stall_area: row.stall_area,
      price_per_m2: row.price_per_m2,
      start_date: toDateString(row.start_date),
      end_date: toDateString(row.end_date),
      lease_duration_years: row.lease_duration_years,
      annual_land_rent: row.annual_land_rent,
      total_payment_land: row.total_payment_land,
      total_payment: row.total_payment,
      approval_status: row.approval_status,
      current_step: row.current_step,
      payment_status: row.payment_status,
      is_fully_paid: row.is_fully_paid,
      permit_status: row.permit_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      payment_due: {
        due_date: toDateString(row.start_date),
        due_status: row.due_status,
        days_remaining: row.days_remaining,
        due_amount: Number(row.total_payment || 0),
      },
    }));

    return Response.json({
      success: true,
      message: "Berhasil mengambil laporan jatuh tempo pembayaran izin lahan.",
      data: rows,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
      summary: {
        total: rows.length,
        dueSoon: rows.filter((item) => item.payment_due?.due_status === "dueSoon")
          .length,
        overdue: rows.filter((item) => item.payment_due?.due_status === "overdue")
          .length,
      },
    });
  } catch (error) {
    console.error("Error fetching land permit payment due report:", error);
    return Response.json(
      {
        success: false,
        message: "Gagal mengambil laporan jatuh tempo pembayaran izin lahan.",
      },
      { status: 500 },
    );
  }
}
