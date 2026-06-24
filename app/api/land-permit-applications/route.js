import moment from "moment";
import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, requireRole, unauthorizedResponse } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { calculateAnnualLandRent } from "@/app/utils/landPermitCalculations";
import { validateLandPermitApplicationPayload } from "./validation";

const LAND_PERMIT_APPLICATION_ROLES = [1, 9];
const APPROVAL_STEPS = [
  { role_id: 3, step_order: 1 },
  { role_id: 4, step_order: 2 },
  { role_id: 5, step_order: 3 },
  { role_id: 6, step_order: 4 },
  { role_id: 7, step_order: 5 },
];

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("YYYY-MM-DD") : null;

const mapApplicationRow = (row) => ({
  land_permit_application_id: row.land_permit_application_id || row.id,
  id: row.land_permit_application_id || row.id,
  renewal_of: row.renewal_of,
  application_type: row.application_type,
  user_id: row.user_id,
  tenant_identity_id: row.tenant_identity_id,
  tenant_name: row.tenant_name,
  tenant_nik: row.tenant_nik,
  tenant_phone: row.tenant_phone,
  ktp_file_path: row.ktp_file_path,
  profile_photo_file_path: row.profile_photo_file_path,
  birth_place: row.birth_place,
  birth_date: row.birth_date,
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
  postal_code: row.postal_code,
  land_permit_status: row.land_permit_status,
  land_permit_status_notes: row.land_permit_status_notes,
  status: row.identity_status,
  is_room_rental_registered: row.is_room_rental_registered,
  is_land_permit_registered: row.is_land_permit_registered,
  commodity_type: row.commodity_type,
  document_number: row.document_number,
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
  start_date: formatDate(row.start_date),
  end_date: formatDate(row.end_date),
  lease_duration_years: row.lease_duration_years,
  annual_land_rent: row.annual_land_rent,
  total_payment_land: row.total_payment_land,
  total_payment: row.total_payment,
  approval_status: row.approval_status,
  current_step: row.current_step,
  payment_status: row.payment_status,
  is_fully_paid: row.is_fully_paid,
  permit_status: row.permit_status,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  old_application: row.old_application_id
    ? {
        land_permit_application_id: row.old_application_id,
        tenant_name: row.old_tenant_name,
        stall_number: row.old_stall_number,
        sector_name: row.old_sector_name,
        location_name: row.old_location_name,
        start_date: formatDate(row.old_start_date),
        end_date: formatDate(row.old_end_date),
      }
    : null,
});

const selectApplicationsSql = `
  SELECT
    lpa.id AS land_permit_application_id,
    lpa.renewal_of,
    lpa.application_type,
    lpa.user_id,
    lpa.tenant_identity_id,
    lpa.commodity_type,
    lpa.document_number,
    lpa.location_id,
    lpa.sector_id,
    lpa.stall_id,
    lpa.start_date,
    lpa.end_date,
    lpa.lease_duration_years,
    lpa.annual_land_rent,
    lpa.total_payment_land,
    lpa.total_payment,
    lpa.approval_status,
    lpa.current_step,
    lpa.payment_status,
    lpa.is_fully_paid,
    lpa.permit_status,
    lpa.created_at,
    lpa.updated_at,
    ti.full_name AS tenant_name,
    ti.nik AS tenant_nik,
    ti.phone AS tenant_phone,
    ti.ktp_file_path,
    ti.profile_photo_file_path,
    ti.birth_place,
    ti.birth_date,
    ti.nationality,
    ti.religion,
    ti.occupation,
    ti.street_address,
    ti.rt,
    ti.rw,
    ti.kelurahan,
    ti.district,
    ti.city,
    ti.province,
    ti.postal_code,
    ti.land_permit_status,
    ti.land_permit_status_notes,
    ti.status AS identity_status,
    ti.is_room_rental_registered,
    ti.is_land_permit_registered,
    l.location_name,
    ls.sector_name,
    ls.sector_code,
    lst.stall_number,
    lst.stall_length,
    lst.stall_width,
    lst.stall_area,
    lst.price_per_m2,
    old.id AS old_application_id,
    old_ti.full_name AS old_tenant_name,
    old_lst.stall_number AS old_stall_number,
    old_ls.sector_name AS old_sector_name,
    old_l.location_name AS old_location_name,
    old.start_date AS old_start_date,
    old.end_date AS old_end_date
  FROM land_permit_applications lpa
  JOIN tenant_identities ti ON ti.id = lpa.tenant_identity_id
  JOIN locations l ON l.id = lpa.location_id
  JOIN land_sectors ls ON ls.id = lpa.sector_id
  JOIN land_stalls lst ON lst.id = lpa.stall_id
  LEFT JOIN land_permit_applications old ON old.id = lpa.renewal_of
  LEFT JOIN tenant_identities old_ti ON old_ti.id = old.tenant_identity_id
  LEFT JOIN locations old_l ON old_l.id = old.location_id
  LEFT JOIN land_sectors old_ls ON old_ls.id = old.sector_id
  LEFT JOIN land_stalls old_lst ON old_lst.id = old.stall_id
`;

const getStallForApplication = async (client, values, currentApplicationId = null) => {
  const result = await client.query(
    `
    SELECT
      lst.id,
      lst.location_id,
      lst.sector_id,
      lst.status,
      lst.stall_length,
      lst.stall_width,
      lst.stall_area,
      lst.price_per_m2,
      ls.status AS sector_status
    FROM land_stalls lst
    JOIN land_sectors ls ON ls.id = lst.sector_id
    WHERE lst.id = $1
      AND lst.location_id = $2
      AND lst.sector_id = $3
    LIMIT 1
    `,
    [values.stall_id, values.location_id, values.sector_id],
  );

  if (result.rowCount === 0) {
    return { error: "Lapak tidak ditemukan pada lokasi dan sektor yang dipilih." };
  }

  const stall = result.rows[0];
  if (stall.sector_status !== "active") {
    return { error: "Sektor yang dipilih tidak aktif." };
  }

  if (stall.status !== "available") {
    if (values.renewal_of) {
      const renewalUsesSameStall = await client.query(
        `
        SELECT 1
        FROM land_permit_applications
        WHERE id = $1
          AND stall_id = $2
          AND approval_status = 'approved'
        LIMIT 1
        `,
        [values.renewal_of, values.stall_id],
      );

      if (renewalUsesSameStall.rowCount > 0) {
        return { stall };
      }
    }

    const sameApplication = currentApplicationId
      ? await client.query(
          "SELECT 1 FROM land_permit_applications WHERE id = $1 AND stall_id = $2 LIMIT 1",
          [currentApplicationId, values.stall_id],
        )
      : { rowCount: 0 };

    if (sameApplication.rowCount === 0) {
      return { error: "Lapak yang dipilih tidak tersedia." };
    }
  }

  return { stall };
};

const ensureIdentityEligible = async (client, identityId) => {
  const result = await client.query(
    `
    SELECT id
    FROM tenant_identities
    WHERE id = $1
      AND is_land_permit_registered = TRUE
      AND land_permit_status = 'active'
    LIMIT 1
    `,
    [identityId],
  );

  return result.rowCount > 0;
};

const releaseStallIfUnused = async (client, stallId) => {
  if (!stallId) return;

  const used = await client.query(
    `
    SELECT 1
    FROM land_permit_applications
    WHERE stall_id = $1
      AND approval_status IN ('proses', 'approved')
      AND permit_status <> 'terminated'
    LIMIT 1
    `,
    [stallId],
  );

  if (used.rowCount === 0) {
    await client.query("UPDATE land_stalls SET status = 'available' WHERE id = $1", [
      stallId,
    ]);
  }
};

export async function GET() {
  try {
    const { response } = await requireRole(LAND_PERMIT_APPLICATION_ROLES);
    if (response) return response;

    const result = await pool.query(`
      ${selectApplicationsSql}
      ORDER BY lpa.created_at DESC
    `);

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data permohonan izin lahan.",
      data: result.rows.map(mapApplicationRow),
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land permit applications",
      error,
      "Terjadi kesalahan saat mengambil data permohonan izin lahan.",
    );
  }
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_PERMIT_APPLICATION_ROLES);
    if (response) return response;

    const authUser = await getAuthenticatedUser();
    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const { values, error } = validateLandPermitApplicationPayload(body);
    if (error) return failResponse(error, 400);

    await client.query("BEGIN");

    const eligible = await ensureIdentityEligible(client, values.tenant_identity_id);
    if (!eligible) {
      await client.query("ROLLBACK");
      return failResponse(
        "Identitas tidak terdaftar atau tidak aktif untuk izin lahan.",
        400,
      );
    }

    const { stall, error: stallError } = await getStallForApplication(client, values);
    if (stallError) {
      await client.query("ROLLBACK");
      return failResponse(stallError, 400);
    }

    const annualLandRent = calculateAnnualLandRent(stall);
    const totalPaymentLand = annualLandRent * values.lease_duration_years;

    const result = await client.query(
      `
      INSERT INTO land_permit_applications (
        renewal_of, application_type, user_id, tenant_identity_id, commodity_type,
        document_number, location_id, sector_id, stall_id, start_date, end_date,
        lease_duration_years, annual_land_rent, total_payment_land, total_payment,
        approval_status, current_step, payment_status, is_fully_paid, permit_status
      )
      VALUES (
        $1, $2, $3, $4, $5,
        NULL, $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        'proses', 1, 'unpaid', false, 'draft'
      )
      RETURNING id
      `,
      [
        values.renewal_of,
        values.application_type,
        authUser.id,
        values.tenant_identity_id,
        values.commodity_type,
        values.location_id,
        values.sector_id,
        values.stall_id,
        values.start_date,
        values.end_date,
        values.lease_duration_years,
        annualLandRent,
        totalPaymentLand,
        totalPaymentLand,
      ],
    );

    const applicationId = result.rows[0].id;
    for (const step of APPROVAL_STEPS) {
      await client.query(
        `
        INSERT INTO land_permit_approval (
          land_permit_application_id, role_id, step_order, status
        )
        VALUES ($1, $2, $3, 'pending')
        `,
        [applicationId, step.role_id, step.step_order],
      );
    }

    await client.query(
      "UPDATE land_stalls SET status = 'occupied', notes = $2 WHERE id = $1",
      [
        values.stall_id,
        `Lapak sedang diproses untuk permohonan izin lahan mulai ${values.start_date} s/d ${values.end_date}.`,
      ],
    );

    await client.query("COMMIT");

    return jsonResponse(
      {
        success: true,
        message: "Permohonan izin lahan berhasil ditambahkan.",
        data: { id: applicationId },
      },
      201,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error creating land permit application",
      error,
      "Terjadi kesalahan saat menambah permohonan izin lahan.",
    );
  } finally {
    client.release();
  }
}
