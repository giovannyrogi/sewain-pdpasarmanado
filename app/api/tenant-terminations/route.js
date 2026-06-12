import pool from "@/lib/dbConfig";
import moment from "moment";
import path from "path";
import fs from "fs";
import { getAuthenticatedUser, requireRole, unauthorizedResponse } from "@/app/utils/auth";
import {
  getTerminationNotificationContext,
  notifyTerminationCreated,
} from "@/app/utils/notifications";

const uploadDir = path.join(process.cwd(), "uploads/surat_pernyataan");
// Pastikan folder upload ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const TENANT_TERMINATION_ROLES = [1, 2];
const MAX_STATEMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_STATEMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

function sanitizeFilenamePart(value) {
  return String(value || "tenant")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "tenant";
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const { response: roleResponse } = await requireRole(TENANT_TERMINATION_ROLES);
    if (roleResponse) return roleResponse;

    const formData = await req.formData();
    const tenant_application_id = Number(formData.get("tenant_application_id"));
    const reason = String(formData.get("reason") || "").trim();
    const surat_file = formData.get("statement_file");
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return unauthorizedResponse();
    }

    const processed_by = authUser.id;

    if (!Number.isInteger(tenant_application_id) || tenant_application_id <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Data kontrak tidak valid" }),
        { status: 400 }
      );
    }

    if (!reason || reason.length > 150 || !surat_file || !processed_by) {
      return new Response(
        JSON.stringify({ success: false, message: "Data wajib belum lengkap" }),
        { status: 400 }
      );
    }

    // cek tenant_application valid + ambil tenant_name dari tenant_identities
    const tenantApp = await client.query(
      `
        SELECT ti.full_name AS tenant_name
        FROM tenant_application ta
        JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
        WHERE ta.id = $1
      `,
      [tenant_application_id]
    );

    if (tenantApp.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tenant application tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const tenantName = tenantApp.rows[0].tenant_name || "tenant";

    // Upload file surat pernyataan
    let statement_file_path = null;
    let fileBuffer = null;
    let filename = null;
    if (surat_file && typeof surat_file === "object") {
      if (surat_file.size > MAX_STATEMENT_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Ukuran file surat pernyataan maksimal 5MB",
          }),
          { status: 400 }
        );
      }

      const arrayBuffer = await surat_file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      // Ambil ekstensi asli (bisa .pdf, .docx, dsb.)
      const ext = path.extname(surat_file.name).toLowerCase() || ".pdf";

      // opsional: validasi ekstensi
      if (!ALLOWED_STATEMENT_EXTENSIONS.includes(ext)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Jenis file tidak diizinkan",
          }),
          { status: 400 }
        );
      }

      // Buat nama file
      const safeTenantName = sanitizeFilenamePart(tenantName);

      filename = `surat_${safeTenantName}_${moment(Date.now()).format(
        "YYYY_MM_DD_HH_mm_ss"
      )}${ext}`;
      statement_file_path = `/uploads/surat_pernyataan/${filename}`;
    }

    await client.query("BEGIN");

    // Insert ke tenant_early_terminations
    const insertTermination = await client.query(
      `INSERT INTO tenant_early_terminations 
        (tenant_application_id, reason, statement_file_path, processed_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenant_application_id, reason, statement_file_path, processed_by]
    );

    const termination = insertTermination.rows[0];
    const terminationId = termination.id;

    // Insert step approval sesuai urutan role
    const approvalSteps = [
      { role_id: 3, step_order: 1 },
      { role_id: 4, step_order: 2 },
      { role_id: 5, step_order: 3 },
      { role_id: 6, step_order: 4 },
      { role_id: 7, step_order: 5 },
    ];

    for (const step of approvalSteps) {
      await client.query(
        `INSERT INTO tenant_termination_approval
      (tenant_early_termination_id, role_id, step_order, status, notes)
     VALUES ($1, $2, $3, $4, $5)`,
        [terminationId, step.role_id, step.step_order, "pending", null]
      );
    }

    const notificationContext = await getTerminationNotificationContext(
      client,
      terminationId,
    );

    if (notificationContext) {
      await notifyTerminationCreated(client, notificationContext);
    }

    await client.query("COMMIT");

    // Simpan file ke disk setelah commit
    if (fileBuffer && filename) {
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, fileBuffer);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pengajuan nonaktif berhasil ditambahkan, menunggu approval",
        data: termination,
      }),
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error insert tenant early termination", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan saat membuat pengajuan nonaktif tenant",
      }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(req) {
  try {
    const { response } = await requireRole(TENANT_TERMINATION_ROLES);
    if (response) return response;

    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }

    const result = await pool.query(
      `
      SELECT
        tet.id AS tenant_early_termination_id,
        tet.tenant_application_id,
        tet.reason,
        tet.statement_file_path,
        tet.processed_by,
        u.full_name AS termination_processed_by_full_name,
        tet.current_step AS termination_current_step,
        tet.approval_status AS termination_approval_status,
        tet.is_terminated,
        tet.created_at AS termination_created_at,

        -- ambil identitas dari tenant_identities
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
        ti.ktp_file_path,
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
        ti.status AS tenant_identity_status,
        ti.notes AS tenant_identity_notes,

        -- data application
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.total_payment_room,
        ta.annual_room_rent,
        ta.lease_duration_years,
        ta.total_ppn,
        ta.admin_fee,
        ta.down_payment,
        ta.remaining_payment,
        ta.current_tenor,
        ta.estimated_installment_1,
        ta.estimated_installment_2,
        ta.estimated_installment_3,
        ta.estimated_installment_1_date,
        ta.estimated_installment_2_date,
        ta.estimated_installment_3_date,
        ta.approval_status AS tenant_approval_status,
        ta.current_step AS tenant_current_step,
        ta.created_at,
        ta.user_id,
        ta.tenant_identity_id,

        -- lokasi & ruangan
        l.id AS location_id,
        l.location_name,
        r.id AS room_id,
        r.room_number,
        r.floor_id,
        r.room_length,
        r.room_width,
        r.price_per_m2,
        r.room_area,
        f.floor
      FROM tenant_early_terminations tet
      JOIN tenant_application ta ON tet.tenant_application_id = ta.id
      JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      JOIN rooms r ON ta.room_id = r.id
      JOIN locations l ON ta.location_id = l.id
      LEFT JOIN location_floor_prices f ON r.floor_id = f.id
      LEFT JOIN users u ON tet.processed_by = u.id
      ORDER BY tet.created_at DESC
      `
    );

    const rows = result.rows.map((row) => ({
      tenant_early_termination_id: row.tenant_early_termination_id,
      tenant_application_id: row.tenant_application_id,
      reason: row.reason,
      statement_file_path: row.statement_file_path,
      processed_by: row.processed_by,
      termination_processed_by_full_name:
        row.termination_processed_by_full_name,
      termination_current_step: row.termination_current_step,
      termination_approval_status: row.termination_approval_status,
      is_terminated: row.is_terminated,
      termination_created_at: moment(row.termination_created_at).format(
        "D MMMM YYYY"
      ),

      tenant_identity_id: row.tenant_identity_id,

      // identitas tenant
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
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
      tenant_identity_status: row.tenant_identity_status,
      tenant_identity_notes: row.tenant_identity_notes,

      // data application
      start_date: row.start_date,
      end_date: row.end_date,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      total_payment_room: row.total_payment_room,
      annual_room_rent: row.annual_room_rent,
      lease_duration_years: row.lease_duration_years,
      total_ppn: row.total_ppn,
      admin_fee: row.admin_fee,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      current_tenor: row.current_tenor,
      estimated_installment_1: row.estimated_installment_1,
      estimated_installment_2: row.estimated_installment_2,
      estimated_installment_3: row.estimated_installment_3,
      estimated_installment_1_date: row.estimated_installment_1_date,
      estimated_installment_2_date: row.estimated_installment_2_date,
      estimated_installment_3_date: row.estimated_installment_3_date,
      tenant_approval_status: row.tenant_approval_status,
      tenant_current_step: row.tenant_current_step,
      created_at: row.created_at,
      user_id: row.user_id,

      // lokasi & ruangan
      location_id: row.location_id,
      location_name: row.location_name,
      room_id: row.room_id,
      room_number: row.room_number,
      floor_id: row.floor_id,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      price_per_m2: row.price_per_m2,
      floor: row.floor,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant terminations",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant terminations", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan saat mengambil data nonaktif tenant",
      }),
      { status: 500 }
    );
  }
}
