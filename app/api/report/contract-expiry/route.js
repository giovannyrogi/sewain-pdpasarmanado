import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const CONTRACT_EXPIRY_DAYS = 30;
const REPORT_ACCESS_ROLES = [1, 2, 3, 4, 5, 6, 7, 8];

const toDateString = (value) =>
  value ? moment(value).format("YYYY-MM-DD") : null;

const getSafeDateRange = (request) => {
  const { searchParams } = new URL(request.url);
  const today = moment().startOf("day");
  const defaultStartDate = moment("2000-01-01");
  const defaultEndDate = today.clone().add(CONTRACT_EXPIRY_DAYS, "days");
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
 * Laporan kontrak berakhir mengambil data buku kontrak yang masih perlu
 * dipantau: akan berakhir 30 hari ke depan atau sudah lewat masa berlaku.
 * Kontrak yang sudah termination final atau sudah diperpanjang dikeluarkan
 * agar laporan tidak menampilkan data yang secara operasional sudah selesai.
 */
export async function GET(request) {
  try {
    const { response } = await requireRole(REPORT_ACCESS_ROLES);
    if (response) return response;

    const { startDate, endDate } = getSafeDateRange(request);

    const sql = `
      WITH terminated AS (
        SELECT tenant_application_id
        FROM tenant_early_terminations
        WHERE approval_status = 'approved' AND is_terminated = true
      ),
      classified AS (
        SELECT
          ta.id AS tenant_application_id,
          ta.document_number,
          ta.start_date,
          ta.end_date,
          ta.payment_type,
          ta.total_payment,
          ta.down_payment,
          ta.remaining_payment,
          ta.approval_status AS tenant_approval_status,
          ta.current_step,
          ta.user_id,
          ta.updated_at AS tenant_updated_at,
          ta.created_at AS tenant_created_at,
          ta.estimated_installment_1,
          ta.estimated_installment_2,
          ta.estimated_installment_3,
          ta.estimated_installment_1_date,
          ta.estimated_installment_2_date,
          ta.estimated_installment_3_date,
          ta.current_payment_step,
          ta.is_fully_paid,
          ta.total_payment_room,
          ta.annual_room_rent,
          ta.lease_duration_years,
          ta.total_ppn,
          ta.admin_fee,

          ti.id AS tenant_identity_id,
          ti.full_name AS tenant_name,
          ti.nik AS tenant_nik,
          ti.phone AS tenant_phone,
          ti.ktp_file_path,
          ti.birth_place,
          ti.birth_date,
          ti.nationality,
          ti.religion,
          ti.occupation,
          ti.street_address AS tenant_street_address,
          ti.rt,
          ti.rw,
          ti.kelurahan AS tenant_kelurahan,
          ti.district AS tenant_district,
          ti.city AS tenant_city,
          ti.province AS tenant_province,
          ti.status AS tenant_status,
          ti.notes AS tenant_notes,

          rm.id AS room_id,
          rm.room_number,
          rm.floor_id,
          rm.room_length,
          rm.room_width,
          rm.room_area,
          rm.price_per_m2,

          lfp.floor,

          loc.id AS location_id,
          loc.location_name,
          loc.location_code,
          loc.street_address AS location_street_address,
          loc.city AS location_city,
          loc.province AS location_province,
          loc.district AS location_district,
          loc.kelurahan AS location_kelurahan,

          c.id AS contract_id,
          c.contract_number,
          c.contract_date,
          c.created_at AS contract_created_at,
          c.updated_at AS contract_updated_at,

          (ta.end_date::date - CURRENT_DATE)::int AS days_remaining,
          CASE
            WHEN ta.end_date::date < CURRENT_DATE THEN 'expired'
            ELSE 'expiringSoon'
          END AS contract_status
        FROM tenant_application ta
        LEFT JOIN LATERAL (
          SELECT
            id,
            contract_number,
            contract_date,
            created_at,
            updated_at
          FROM contracts
          WHERE tenant_application_id = ta.id
          ORDER BY created_at DESC
          LIMIT 1
        ) c ON TRUE
        LEFT JOIN tenant_identities ti ON ti.id = ta.tenant_identity_id
        LEFT JOIN rooms rm ON rm.id = ta.room_id
        LEFT JOIN locations loc ON loc.id = ta.location_id
        LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
        LEFT JOIN terminated t ON t.tenant_application_id = ta.id
        WHERE ta.approval_status = 'approved'
          AND ta.document_number IS NOT NULL
          AND ta.end_date IS NOT NULL
          AND t.tenant_application_id IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM tenant_application child
            WHERE child.renewal_of = ta.id
          )
          AND ta.end_date::date BETWEEN $1::date AND $2::date
          AND (
            ta.end_date::date < CURRENT_DATE
            OR ta.end_date::date <= CURRENT_DATE + ($3::int * INTERVAL '1 day')
          )
      )
      SELECT
        tenant_application_id,
        document_number,
        start_date,
        end_date,
        payment_type,
        total_payment,
        down_payment,
        remaining_payment,
        tenant_approval_status,
        current_step,
        user_id,
        tenant_updated_at,
        tenant_created_at,
        estimated_installment_1,
        estimated_installment_2,
        estimated_installment_3,
        estimated_installment_1_date,
        estimated_installment_2_date,
        estimated_installment_3_date,
        current_payment_step,
        is_fully_paid,
        total_payment_room,
        annual_room_rent,
        lease_duration_years,
        total_ppn,
        admin_fee,
        tenant_identity_id,
        tenant_name,
        tenant_nik,
        tenant_phone,
        ktp_file_path,
        birth_place,
        birth_date,
        nationality,
        religion,
        occupation,
        tenant_street_address,
        rt,
        rw,
        tenant_kelurahan,
        tenant_district,
        tenant_city,
        tenant_province,
        tenant_status,
        tenant_notes,
        room_id,
        room_number,
        floor_id,
        room_length,
        room_width,
        room_area,
        price_per_m2,
        floor,
        location_id,
        location_name,
        location_code,
        location_street_address,
        location_city,
        location_province,
        location_district,
        location_kelurahan,
        contract_id,
        contract_number,
        contract_date,
        contract_created_at,
        contract_updated_at,
        days_remaining,
        contract_status
      FROM classified
      ORDER BY
        CASE WHEN contract_status = 'expired' THEN 0 ELSE 1 END,
        CASE WHEN contract_status = 'expired' THEN end_date END DESC,
        CASE WHEN contract_status = 'expiringSoon' THEN end_date END ASC,
        tenant_application_id DESC
    `;

    const result = await pool.query(sql, [
      startDate,
      endDate,
      CONTRACT_EXPIRY_DAYS,
    ]);

    const rows = result.rows.map((row) => ({
      id: `${row.contract_id}-${row.tenant_application_id}`,
      tenant_application_id: row.tenant_application_id,
      document_number: row.document_number,
      start_date: toDateString(row.start_date),
      end_date: toDateString(row.end_date),
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      approval_status: row.tenant_approval_status,
      current_step: row.current_step,
      user_id: row.user_id,
      updated_at: row.tenant_updated_at,
      created_at: row.tenant_created_at,
      estimated_installment_1: row.estimated_installment_1,
      estimated_installment_2: row.estimated_installment_2,
      estimated_installment_3: row.estimated_installment_3,
      estimated_installment_1_date: row.estimated_installment_1_date,
      estimated_installment_2_date: row.estimated_installment_2_date,
      estimated_installment_3_date: row.estimated_installment_3_date,
      current_payment_step: row.current_payment_step,
      is_fully_paid: row.is_fully_paid,
      total_payment_room: row.total_payment_room,
      annual_room_rent: row.annual_room_rent,
      lease_duration_years: row.lease_duration_years,
      total_ppn: row.total_ppn,
      admin_fee: row.admin_fee,

      tenant_identity_id: row.tenant_identity_id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
      birth_place: row.birth_place,
      birth_date: row.birth_date,
      nationality: row.nationality,
      religion: row.religion,
      occupation: row.occupation,
      street_address: row.tenant_street_address,
      rt: row.rt,
      rw: row.rw,
      kelurahan: row.tenant_kelurahan,
      district: row.tenant_district,
      city: row.tenant_city,
      province: row.tenant_province,
      status: row.tenant_status,
      notes: row.tenant_notes,

      room_id: row.room_id,
      room_number: row.room_number,
      floor_id: row.floor_id,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      price_per_m2: row.price_per_m2,
      floor: row.floor,

      location_id: row.location_id,
      location_name: row.location_name,
      location_code: row.location_code,
      location_street_address: row.location_street_address,
      location_city: row.location_city,
      location_province: row.location_province,
      location_district: row.location_district,
      location_kelurahan: row.location_kelurahan,

      contract_id: row.contract_id,
      contract_number: row.contract_number,
      contract_date: toDateString(row.contract_date),
      contract_created_at: row.contract_created_at,
      contract_updated_at: row.contract_updated_at,

      contract_expiry: {
        end_date: toDateString(row.end_date),
        days_remaining: row.days_remaining,
        contract_status: row.contract_status,
      },
    }));

    return Response.json({
      success: true,
      message: "Berhasil mengambil laporan kontrak segera berakhir.",
      data: rows,
      filters: {
        start_date: startDate,
        end_date: endDate,
      },
      summary: {
        total: rows.length,
        expiringSoon: rows.filter(
          (item) => item.contract_expiry?.contract_status === "expiringSoon",
        ).length,
        expired: rows.filter(
          (item) => item.contract_expiry?.contract_status === "expired",
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching contract expiry report:", error);
    return Response.json(
      {
        success: false,
        message: "Gagal mengambil laporan kontrak segera berakhir.",
      },
      { status: 500 },
    );
  }
}
