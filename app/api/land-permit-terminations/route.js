import fs from "fs";
import path from "path";
import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 9];
const APPROVAL_STEPS = [
  { role_id: 3, step_order: 1 },
  { role_id: 4, step_order: 2 },
  { role_id: 5, step_order: 3 },
  { role_id: 6, step_order: 4 },
  { role_id: 7, step_order: 5 },
];
const MAX_STATEMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_STATEMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "surat_pernyataan_izin_lahan",
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const formatDate = (value) =>
  value && moment(value).isValid() ? moment(value).format("YYYY-MM-DD") : null;

const sanitizeFilenamePart = (value) =>
  String(value || "izin_lahan")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "izin_lahan";

const applicationSelect = `
  SELECT
    app.id AS land_permit_application_id,
    app.renewal_of,
    app.application_type,
    app.user_id,
    app.tenant_identity_id,
    app.commodity_type,
    app.document_number,
    app.location_id,
    app.sector_id,
    app.stall_id,
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
    identity.full_name AS tenant_name,
    identity.nik AS tenant_nik,
    identity.phone AS tenant_phone,
    identity.ktp_file_path,
    identity.profile_photo_file_path,
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
    identity.postal_code,
    identity.land_permit_status,
    identity.land_permit_status_notes,
    identity.status AS identity_status,
    location.location_name,
    location.location_code,
    sector.sector_name,
    sector.sector_code,
    stall.stall_number,
    stall.stall_length,
    stall.stall_width,
    stall.stall_area,
    stall.price_per_m2,
    document.document_number AS permit_document_number
  FROM land_permit_applications app
  JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
  JOIN locations location ON location.id = app.location_id
  JOIN land_sectors sector ON sector.id = app.sector_id
  JOIN land_stalls stall ON stall.id = app.stall_id
  LEFT JOIN LATERAL (
    SELECT doc.document_number
    FROM land_permit_documents doc
    WHERE doc.land_permit_application_id = app.id
      AND doc.document_type = 'permit_document'
      AND doc.status <> 'void'
    ORDER BY doc.created_at DESC
    LIMIT 1
  ) document ON TRUE
`;

const mapApplicationRow = (row) => ({
  land_permit_application_id: row.land_permit_application_id,
  id: row.land_permit_application_id,
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
  identity_status: row.identity_status,
  land_permit_status: row.land_permit_status,
  land_permit_status_notes: row.land_permit_status_notes,
  commodity_type: row.commodity_type,
  document_number: row.document_number,
  permit_document_number: row.permit_document_number,
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
});

const mapTerminationRow = (row) => ({
  ...mapApplicationRow(row),
  land_permit_termination_id: row.land_permit_termination_id,
  termination_reason: row.termination_reason,
  reason: row.termination_reason,
  statement_file_path: row.statement_file_path,
  termination_processed_by: row.termination_processed_by,
  termination_processed_by_full_name:
    row.termination_processed_by_full_name,
  termination_current_step: row.termination_current_step,
  termination_approval_status: row.termination_approval_status,
  is_terminated: row.is_terminated,
  termination_created_at: row.termination_created_at
    ? moment(row.termination_created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

async function getEligibleApplications() {
  const result = await pool.query(
    `
    ${applicationSelect}
    WHERE app.approval_status = 'approved'
      AND app.payment_status = 'paid'
      AND app.is_fully_paid = TRUE
      AND app.permit_status = 'active'
      AND identity.land_permit_status = 'active'
      AND NOT EXISTS (
        SELECT 1
        FROM land_permit_terminations termination
        WHERE termination.land_permit_application_id = app.id
          AND termination.approval_status IN ('proses', 'approved')
      )
    ORDER BY identity.full_name ASC, app.id DESC
    `,
  );

  return result.rows.map(mapApplicationRow);
}

export async function GET(request) {
  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    if (searchParams.get("eligible") === "1") {
      return Response.json({
        success: true,
        message: "Berhasil mengambil izin lahan aktif.",
        data: await getEligibleApplications(),
      });
    }

    const result = await pool.query(
      `
      SELECT
        termination.id AS land_permit_termination_id,
        termination.land_permit_application_id,
        termination.reason AS termination_reason,
        termination.statement_file_path,
        termination.processed_by AS termination_processed_by,
        processor.full_name AS termination_processed_by_full_name,
        termination.current_step AS termination_current_step,
        termination.approval_status AS termination_approval_status,
        termination.is_terminated,
        termination.created_at AS termination_created_at,
        application.*
      FROM land_permit_terminations termination
      JOIN (${applicationSelect}) application
        ON application.land_permit_application_id =
           termination.land_permit_application_id
      LEFT JOIN users processor ON processor.id = termination.processed_by
      ORDER BY termination.created_at DESC, termination.id DESC
      `,
    );

    return Response.json({
      success: true,
      message: "Berhasil mengambil data non-aktif izin lahan.",
      data: result.rows.map(mapTerminationRow),
    });
  } catch (error) {
    console.error("Error fetching land permit terminations:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data non-aktif izin lahan.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const client = await pool.connect();
  let storedFilePath = null;

  try {
    const { user, response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const formData = await request.formData();
    const applicationId = Number(formData.get("land_permit_application_id"));
    const reason = String(formData.get("reason") || "").trim();
    const statementFile = formData.get("statement_file");

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return Response.json(
        { success: false, message: "Izin lahan aktif wajib dipilih." },
        { status: 400 },
      );
    }

    if (!reason || reason.length > 300) {
      return Response.json(
        {
          success: false,
          message: "Alasan non-aktif wajib diisi dan maksimal 300 karakter.",
        },
        { status: 400 },
      );
    }

    if (!statementFile || typeof statementFile !== "object" || !statementFile.size) {
      return Response.json(
        { success: false, message: "Surat pernyataan wajib diunggah." },
        { status: 400 },
      );
    }

    if (statementFile.size > MAX_STATEMENT_FILE_SIZE) {
      return Response.json(
        { success: false, message: "Ukuran surat pernyataan maksimal 5MB." },
        { status: 400 },
      );
    }

    const extension = path.extname(statementFile.name).toLowerCase();
    if (!ALLOWED_STATEMENT_EXTENSIONS.includes(extension)) {
      return Response.json(
        { success: false, message: "Format surat harus PDF, DOC, atau DOCX." },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const applicationResult = await client.query(
      `
      ${applicationSelect}
      WHERE app.id = $1
        AND app.approval_status = 'approved'
        AND app.payment_status = 'paid'
        AND app.is_fully_paid = TRUE
        AND app.permit_status = 'active'
        AND identity.land_permit_status = 'active'
      FOR UPDATE OF app
      `,
      [applicationId],
    );

    if (applicationResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message:
            "Izin lahan belum aktif, belum lunas, atau sudah tidak dapat dinonaktifkan.",
        },
        { status: 400 },
      );
    }

    const duplicateResult = await client.query(
      `
      SELECT id
      FROM land_permit_terminations
      WHERE land_permit_application_id = $1
        AND approval_status IN ('proses', 'approved')
      LIMIT 1
      `,
      [applicationId],
    );

    if (duplicateResult.rowCount > 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message:
            "Izin lahan ini sudah memiliki pengajuan non-aktif yang sedang berjalan atau selesai.",
        },
        { status: 409 },
      );
    }

    const tenantName = applicationResult.rows[0]?.tenant_name || "izin_lahan";
    const safeTenantName = sanitizeFilenamePart(tenantName);
    const filename = `surat_nonaktif_lahan_${safeTenantName}_${moment().format(
      "YYYYMMDD_HHmmss",
    )}${extension}`;
    storedFilePath = `/uploads/surat_pernyataan_izin_lahan/${filename}`;

    const insertResult = await client.query(
      `
      INSERT INTO land_permit_terminations
        (land_permit_application_id, reason, statement_file_path, processed_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [applicationId, reason, storedFilePath, user.id],
    );

    const terminationId = insertResult.rows[0].id;
    for (const step of APPROVAL_STEPS) {
      await client.query(
        `
        INSERT INTO land_permit_termination_approval
          (land_permit_termination_id, role_id, step_order, status)
        VALUES ($1, $2, $3, 'pending')
        `,
        [terminationId, step.role_id, step.step_order],
      );
    }

    const fileBuffer = Buffer.from(await statementFile.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);

    await client.query("COMMIT");

    return Response.json(
      {
        success: true,
        message:
          "Pengajuan non-aktif izin lahan berhasil dibuat dan menunggu approval.",
        data: { land_permit_termination_id: terminationId },
      },
      { status: 201 },
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    if (storedFilePath) {
      const filePath = path.join(uploadDir, path.basename(storedFilePath));
      if (filePath.startsWith(uploadDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    console.error("Error creating land permit termination:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat membuat pengajuan non-aktif izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
