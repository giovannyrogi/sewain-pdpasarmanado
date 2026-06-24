import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];
const WRITE_ROLES = [1, 9];
const DOCUMENT_TYPE = "permit_document";
const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const getRomanMonth = (value) =>
  value && moment(value).isValid() ? ROMAN_MONTHS[moment(value).month()] : null;

const mapRow = (row) => ({
  document_id: row.document_id,
  document_number: row.document_number,
  document_status: row.document_status,
  document_created_at: row.document_created_at,
  printed_at: row.printed_at,
  printed_by: row.printed_by,
  land_permit_application_id: row.land_permit_application_id,
  tenant_identity_id: row.tenant_identity_id,
  tenant_name: row.tenant_name,
  tenant_nik: row.tenant_nik,
  tenant_phone: row.tenant_phone,
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
  ktp_file_path: row.ktp_file_path,
  profile_photo_file_path: row.profile_photo_file_path,
  application_type: row.application_type,
  commodity_type: row.commodity_type,
  start_date: row.start_date
    ? moment(row.start_date).format("YYYY-MM-DD")
    : null,
  end_date: row.end_date ? moment(row.end_date).format("YYYY-MM-DD") : null,
  lease_duration_years: row.lease_duration_years,
  annual_land_rent: row.annual_land_rent,
  total_payment_land: row.total_payment_land,
  total_payment: row.total_payment,
  application_approval_status: row.application_approval_status,
  payment_status: row.payment_status,
  permit_status: row.permit_status,
  location_id: row.location_id,
  location_name: row.location_name,
  location_code: row.location_code,
  sector_id: row.sector_id,
  sector_name: row.sector_name,
  sector_code: row.sector_code,
  stall_id: row.stall_id,
  stall_number: row.stall_number,
  stall_length: row.stall_length,
  stall_width: row.stall_width,
  stall_area: row.stall_area,
  price_per_m2: row.price_per_m2,
  payment_id: row.payment_id,
  payment_date: row.payment_date
    ? moment(row.payment_date).format("YYYY-MM-DD")
    : null,
  payment_approved_at: row.payment_approved_at,
  fully_paid_date: row.fully_paid_date
    ? moment(row.fully_paid_date).format("YYYY-MM-DD")
    : null,
  fully_paid_month_roman: getRomanMonth(row.fully_paid_date),
  fully_paid_year: row.fully_paid_date
    ? moment(row.fully_paid_date).format("YYYY")
    : null,
  latest_document_number: row.latest_document_number,
  latest_document_number_only: row.latest_document_number_only,
});

const BASE_SELECT = `
  SELECT
    document.id AS document_id,
    document.document_number,
    document.status AS document_status,
    document.created_at AS document_created_at,
    document.printed_at,
    document.printed_by,
    app.id AS land_permit_application_id,
    app.tenant_identity_id,
    app.application_type,
    app.commodity_type,
    app.start_date,
    app.end_date,
    app.lease_duration_years,
    app.annual_land_rent,
    app.total_payment_land,
    app.total_payment,
    app.approval_status AS application_approval_status,
    app.payment_status,
    app.permit_status,
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
    location.id AS location_id,
    location.location_name,
    location.location_code,
    sector.id AS sector_id,
    sector.sector_name,
    sector.sector_code,
    stall.id AS stall_id,
    stall.stall_number,
    stall.stall_length,
    stall.stall_width,
    stall.stall_area,
    stall.price_per_m2,
    payment.id AS payment_id,
    payment.payment_date,
    payment_approval.approved_at AS payment_approved_at,
    COALESCE(
      payment_approval.approved_at::date,
      payment.accounting_date,
      payment.payment_date
    ) AS fully_paid_date,
    latest_document.document_number AS latest_document_number,
    latest_document.document_number_only AS latest_document_number_only
  FROM land_permit_applications app
  JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
  JOIN locations location ON location.id = app.location_id
  JOIN land_sectors sector ON sector.id = app.sector_id
  JOIN land_stalls stall ON stall.id = app.stall_id
  JOIN land_permit_payments payment
    ON payment.land_permit_application_id = app.id
   AND payment.approval_status = 'approved'
  JOIN land_permit_payment_approval payment_approval
    ON payment_approval.land_permit_payment_id = payment.id
   AND payment_approval.status = 'approved'
  LEFT JOIN land_permit_documents document
    ON document.land_permit_application_id = app.id
   AND document.document_type = '${DOCUMENT_TYPE}'
  LEFT JOIN LATERAL (
    SELECT
      previous.document_number,
      CAST(
        NULLIF(
          regexp_replace(previous.document_number, '^([0-9]+).*$', '\\1'),
          ''
        ) AS INTEGER
      ) AS document_number_only
    FROM land_permit_documents previous
    WHERE previous.document_type = '${DOCUMENT_TYPE}'
      AND previous.document_number ~ '^[0-9]+'
    ORDER BY document_number_only DESC, previous.id DESC
    LIMIT 1
  ) latest_document ON TRUE
`;

export async function GET() {
  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const [documentsResult, eligibleResult] = await Promise.all([
      pool.query(`
        ${BASE_SELECT}
        WHERE document.id IS NOT NULL
        ORDER BY document.created_at DESC, document.id DESC
      `),
      pool.query(`
        ${BASE_SELECT}
        WHERE app.approval_status = 'approved'
          AND app.is_fully_paid = TRUE
          AND app.permit_status <> 'terminated'
          AND document.id IS NULL
        ORDER BY identity.full_name ASC, app.id ASC
      `),
    ]);

    return Response.json({
      success: true,
      message: "Berhasil mengambil dokumen izin lahan.",
      data: documentsResult.rows.map(mapRow),
      eligible_applications: eligibleResult.rows.map(mapRow),
    });
  } catch (error) {
    console.error("Error fetching land permit documents:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil dokumen izin lahan.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(WRITE_ROLES);
    if (response) return response;

    const body = await request.json();
    const applicationId = Number(body.land_permit_application_id);
    const documentNumberOnly = String(body.document_number || "").trim();

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return Response.json(
        { success: false, message: "Data penyewa wajib dipilih." },
        { status: 400 },
      );
    }
    if (!/^[0-9]+$/.test(documentNumberOnly)) {
      return Response.json(
        {
          success: false,
          message: "Nomor dokumen hanya boleh berisi angka.",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const applicationResult = await client.query(
      `
      SELECT
        app.id,
        location.location_code,
        COALESCE(
          approval.approved_at::date,
          payment.accounting_date,
          payment.payment_date
        ) AS fully_paid_date
      FROM land_permit_applications app
      JOIN locations location ON location.id = app.location_id
      JOIN land_permit_payments payment
        ON payment.land_permit_application_id = app.id
       AND payment.approval_status = 'approved'
      JOIN land_permit_payment_approval approval
        ON approval.land_permit_payment_id = payment.id
       AND approval.status = 'approved'
      WHERE app.id = $1
        AND app.approval_status = 'approved'
        AND app.is_fully_paid = TRUE
        AND app.permit_status <> 'terminated'
      FOR UPDATE OF app, payment, approval
      `,
      [applicationId],
    );

    if (applicationResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message:
            "Permohonan belum lunas, belum disetujui Keuangan, atau sudah tidak aktif.",
        },
        { status: 400 },
      );
    }

    const duplicateApplication = await client.query(
      `
      SELECT id
      FROM land_permit_documents
      WHERE land_permit_application_id = $1
        AND document_type = $2
      LIMIT 1
      `,
      [applicationId, DOCUMENT_TYPE],
    );
    if (duplicateApplication.rowCount > 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Dokumen izin lahan untuk pemohon ini sudah dibuat.",
        },
        { status: 409 },
      );
    }

    const duplicateNumber = await client.query(
      `
      SELECT id
      FROM land_permit_documents
      WHERE document_type = $1
        AND trim(split_part(document_number, '/', 1)) = $2
      LIMIT 1
      `,
      [DOCUMENT_TYPE, documentNumberOnly],
    );
    if (duplicateNumber.rowCount > 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: `Nomor dokumen ${documentNumberOnly} sudah digunakan.`,
        },
        { status: 409 },
      );
    }

    const application = applicationResult.rows[0];
    const monthRoman = getRomanMonth(application.fully_paid_date);
    const year = moment(application.fully_paid_date).format("YYYY");
    const locationCode = String(application.location_code || "").trim();

    if (!locationCode || !monthRoman || !year) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message:
            "Kode lokasi atau tanggal pelunasan belum tersedia untuk membentuk nomor dokumen.",
        },
        { status: 400 },
      );
    }

    const fullDocumentNumber =
      `${documentNumberOnly}/PM/SIL-${locationCode}/${monthRoman}/${year}`;

    const result = await client.query(
      `
      INSERT INTO land_permit_documents (
        land_permit_application_id,
        document_type,
        document_number,
        status
      )
      VALUES ($1, $2, $3, 'active')
      RETURNING id, land_permit_application_id, document_number, status, created_at
      `,
      [applicationId, DOCUMENT_TYPE, fullDocumentNumber],
    );

    await client.query("COMMIT");

    return Response.json(
      {
        success: true,
        message: "Dokumen izin lahan berhasil dibuat.",
        data: result.rows[0],
      },
      { status: 201 },
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("Error creating land permit document:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat membuat dokumen izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
