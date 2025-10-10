import pool from "@/lib/dbConfig";
import moment from "moment";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public/uploads/surat_pernyataan");
// Pastikan folder upload ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const formData = await req.formData();
    const tenant_application_id = formData.get("tenant_application_id");
    const reason = formData.get("reason");
    const processed_by = formData.get("processed_by");
    const surat_file = formData.get("statement_file");

    if (!tenant_application_id || !reason || !surat_file || !processed_by) {
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
      const arrayBuffer = await surat_file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      // Ambil ekstensi asli (bisa .pdf, .docx, dsb.)
      const ext = path.extname(surat_file.name) || ".pdf";

      // opsional: validasi ekstensi
      const allowed = [".pdf", ".doc", ".docx"];
      if (!allowed.includes(ext.toLowerCase())) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Jenis file tidak diizinkan",
          }),
          { status: 400 }
        );
      }

      // Buat nama file aman
      const safeTenantName = tenantName
        .replace(/\s+/g, "_")
        .replace(/[^\w\-]/g, "");

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
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(req) {
  try {
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

        -- data application
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.down_payment,
        ta.remaining_payment,
        ta.approval_status AS tenant_approval_status,
        ta.current_step AS tenant_current_step,
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
        f.base_price,
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

      // data application
      start_date: row.start_date,
      end_date: row.end_date,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      tenant_approval_status: row.tenant_approval_status,
      tenant_current_step: row.tenant_current_step,
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
      base_price: row.base_price,
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
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
