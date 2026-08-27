import fs from "fs";
import path from "path";
import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  getLandPermitPaymentNotificationContext,
  notifyLandPermitPaymentSubmitted,
} from "@/app/utils/notifications";

const ACCESS_ROLES = [1, 3, 4, 5, 8, 9];
const WRITE_ROLES = [1, 9];
const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "bukti_transfer_ijin_lahan",
);

function sanitizeFilenamePart(value) {
  return (
    String(value || "penyewa")
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "penyewa"
  );
}

function isValidDate(value) {
  return Boolean(value && moment(value, "YYYY-MM-DD", true).isValid());
}

function mapPaymentRow(row) {
  return {
    land_permit_payment_id: row.land_permit_payment_id,
    land_permit_application_id: row.land_permit_application_id,
    payment_number: row.payment_number,
    payment_amount: row.payment_amount,
    payment_date: row.payment_date
      ? moment(row.payment_date).format("YYYY-MM-DD")
      : null,
    accounting_date: row.accounting_date
      ? moment(row.accounting_date).format("YYYY-MM-DD")
      : null,
    proof_file_path: row.proof_file_path,
    payment_approval_status: row.payment_approval_status,
    uploaded_by: row.uploaded_by,
    payment_created_at: row.payment_created_at,
    payment_updated_at: row.payment_updated_at,
    payment_approval_id: row.payment_approval_id,
    payment_approval_role_id: row.payment_approval_role_id,
    payment_approval_step: row.payment_approval_step,
    payment_approval_record_status: row.payment_approval_record_status,
    payment_approval_notes: row.payment_approval_notes,
    payment_approver_id: row.payment_approver_id,
    payment_approved_at: row.payment_approved_at,
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
    administration_type: row.administration_type,
    admin_fee: row.admin_fee,
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
    is_fully_paid: row.is_fully_paid,
    permit_status: row.permit_status,
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
    fixed_annual_fee: row.fixed_annual_fee,
  };
}

const APPLICATION_SELECT = `
  SELECT
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
    app.is_fully_paid,
    app.permit_status,
    app.admin_fee,
    app.administration_type,
    app.user_id AS application_created_by,
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
    sector.id AS sector_id,
    sector.sector_name,
    sector.sector_code,
    stall.id AS stall_id,
    stall.stall_number,
    stall.stall_length,
    stall.stall_width,
    stall.stall_area,
    stall.price_per_m2
    , stall.fixed_annual_fee
  FROM land_permit_applications app
  JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
  JOIN locations location ON location.id = app.location_id
  JOIN land_sectors sector ON sector.id = app.sector_id
  JOIN land_stalls stall ON stall.id = app.stall_id
`;

export async function GET() {
  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const [paymentResult, eligibleResult] = await Promise.all([
      pool.query(
        `
        SELECT
          payment.id AS land_permit_payment_id,
          payment.land_permit_application_id,
          payment.payment_number,
          payment.amount AS payment_amount,
          payment.payment_date,
          payment.accounting_date,
          payment.proof_file_path,
          payment.uploaded_by,
          payment.approval_status AS payment_approval_status,
          payment.created_at AS payment_created_at,
          payment.updated_at AS payment_updated_at,
          approval.id AS payment_approval_id,
          approval.role_id AS payment_approval_role_id,
          approval.step_order AS payment_approval_step,
          approval.status AS payment_approval_record_status,
          approval.notes AS payment_approval_notes,
          approval.approver_id AS payment_approver_id,
          approval.approved_at AS payment_approved_at,
          application.*
        FROM land_permit_payments payment
        JOIN (${APPLICATION_SELECT}) application
          ON application.land_permit_application_id =
             payment.land_permit_application_id
        LEFT JOIN land_permit_payment_approval approval
          ON approval.land_permit_payment_id = payment.id
        ORDER BY payment.created_at DESC, payment.id DESC
        `,
      ),
      pool.query(
        `
        ${APPLICATION_SELECT}
        WHERE app.approval_status = 'approved'
          AND app.start_date IS NOT NULL
          AND app.end_date IS NOT NULL
          AND app.permit_status <> 'terminated'
          AND NOT EXISTS (
            SELECT 1
            FROM land_permit_payments payment
            WHERE payment.land_permit_application_id = app.id
          )
        ORDER BY identity.full_name ASC, app.id ASC
        `,
      ),
    ]);

    return Response.json({
      success: true,
      message: "Berhasil mengambil data pembayaran izin lahan.",
      data: paymentResult.rows.map(mapPaymentRow),
      eligible_applications: eligibleResult.rows.map(mapPaymentRow),
    });
  } catch (error) {
    console.error("Error fetching land permit payments:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil pembayaran izin lahan.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const client = await pool.connect();
  let storedFilePath = null;

  try {
    const { user, response } = await requireRole(WRITE_ROLES);
    if (response) return response;

    const formData = await request.formData();
    const applicationId = Number(formData.get("land_permit_application_id"));
    const paymentDate = formData.get("payment_date");
    const proofFile = formData.get("proof_file");

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return Response.json(
        { success: false, message: "Permohonan izin lahan wajib dipilih." },
        { status: 400 },
      );
    }

    if (!isValidDate(paymentDate)) {
      return Response.json(
        { success: false, message: "Tanggal pembayaran tidak valid." },
        { status: 400 },
      );
    }

    if (!proofFile || typeof proofFile !== "object" || !proofFile.size) {
      return Response.json(
        { success: false, message: "Bukti pembayaran wajib diunggah." },
        { status: 400 },
      );
    }

    if (proofFile.size > MAX_PROOF_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "Ukuran file bukti pembayaran maksimal 5MB.",
        },
        { status: 400 },
      );
    }

    const extension = path.extname(proofFile.name).toLowerCase();
    if (!ALLOWED_PROOF_EXTENSIONS.includes(extension)) {
      return Response.json(
        {
          success: false,
          message: "Format bukti pembayaran harus JPG, PNG, atau PDF.",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    const applicationResult = await client.query(
      `
      ${APPLICATION_SELECT}
      WHERE app.id = $1
        AND app.approval_status = 'approved'
        AND app.start_date IS NOT NULL
        AND app.end_date IS NOT NULL
        AND app.permit_status <> 'terminated'
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
            "Permohonan belum disetujui final atau sudah tidak dapat dibayar.",
        },
        { status: 400 },
      );
    }

    const duplicateResult = await client.query(
      `
      SELECT id
      FROM land_permit_payments
      WHERE land_permit_application_id = $1
      LIMIT 1
      `,
      [applicationId],
    );

    if (duplicateResult.rowCount > 0) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Bukti pembayaran untuk permohonan ini sudah tersedia.",
        },
        { status: 409 },
      );
    }

    const application = applicationResult.rows[0];
    const amount = Number(application.total_payment || 0);
    if (!(amount > 0)) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: "Total pembayaran permohonan tidak valid.",
        },
        { status: 400 },
      );
    }

    const filename = `bukti_transfer_izin_lahan_${sanitizeFilenamePart(
      application.tenant_name,
    )}_${applicationId}_${moment().format(
      "YYYY_MM_DD_HH_mm_ss_SSS",
    )}${extension}`;
    const proofFilePath = `/uploads/bukti_transfer_ijin_lahan/${filename}`;

    const paymentResult = await client.query(
      `
      INSERT INTO land_permit_payments (
        land_permit_application_id,
        payment_number,
        amount,
        payment_date,
        proof_file_path,
        uploaded_by,
        approval_status
      )
      VALUES ($1, 1, $2, $3, $4, $5, 'proses')
      RETURNING id
      `,
      [
        applicationId,
        amount,
        moment(paymentDate).format("YYYY-MM-DD"),
        proofFilePath,
        user.id,
      ],
    );

    const paymentId = paymentResult.rows[0].id;
    await client.query(
      `
      INSERT INTO land_permit_payment_approval (
        land_permit_payment_id,
        role_id,
        step_order,
        status
      )
      VALUES ($1, 8, 1, 'pending')
      `,
      [paymentId],
    );

    await client.query(
      `
      UPDATE land_permit_applications
      SET payment_status = 'proses',
          is_fully_paid = FALSE,
          updated_at = NOW()
      WHERE id = $1
      `,
      [applicationId],
    );

    const notificationContext = await getLandPermitPaymentNotificationContext(
      client,
      paymentId,
    );
    if (notificationContext) {
      await notifyLandPermitPaymentSubmitted(
        client,
        notificationContext,
        user.id,
      );
    }

    await client.query("COMMIT");

    fs.mkdirSync(uploadDir, { recursive: true });
    const fileBuffer = Buffer.from(await proofFile.arrayBuffer());
    storedFilePath = path.join(uploadDir, filename);
    fs.writeFileSync(storedFilePath, fileBuffer);

    return Response.json({
      success: true,
      message:
        "Bukti pembayaran izin lahan berhasil dibuat dan menunggu verifikasi keuangan.",
      payment_id: paymentId,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    if (storedFilePath && fs.existsSync(storedFilePath)) {
      try {
        fs.unlinkSync(storedFilePath);
      } catch {}
    }

    console.error("Error creating land permit payment:", error);
    return Response.json(
      {
        success: false,
        message: "Terjadi kesalahan saat membuat bukti pembayaran izin lahan.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
