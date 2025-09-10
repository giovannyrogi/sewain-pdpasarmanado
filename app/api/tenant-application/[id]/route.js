import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

const uploadDir = path.join(process.cwd(), "public/uploads/ktp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function PUT(req, { params }) {
  const { id } = params;

  try {
    const formData = await req.formData();

    // Ambil fields
    const location_id = formData.get("location_id");
    const room_id = formData.get("room_id");
    const tenant_name = formData.get("tenant_name");
    const tenant_nik = formData.get("tenant_nik");
    const tenant_phone = formData.get("tenant_phone");
    // const start_date = formData.get("start_date");
    // const end_date = formData.get("end_date");
    const payment_type = formData.get("payment_type");
    const total_payment = formData.get("total_payment");
    const down_payment = formData.get("down_payment");
    const remaining_payment = formData.get("remaining_payment");
    const approval_status = formData.get("approval_status");
    const ktp_file = formData.get("ktp_file");
    const ktp_file_path_old = formData.get("ktp_file_path");
    // const current_step = formData.get("current_step");
    const user_id = formData.get("user_id");

    // Validasi wajib
    if (
      !location_id ||
      !room_id ||
      !tenant_name ||
      !tenant_nik ||
      !tenant_phone
    ) {
      return Response.json(
        { success: false, message: "Data wajib tidak lengkap." },
        { status: 400 }
      );
    }

    // Ambil data lama tenant
    const oldDataRes = await pool.query(
      "SELECT * FROM tenant_application WHERE id = $1",
      [id]
    );
    if (oldDataRes.rowCount === 0) {
      return Response.json(
        { success: false, message: "Data tidak ditemukan" },
        { status: 404 }
      );
    }
    const oldData = oldDataRes.rows[0];
    const oldRoomId = oldData.room_id;

    // Kalau current_step tidak dikirim, gunakan yang lama
    const stepToUse = oldData.current_step;

    // Validasi room + lokasi
    const roomCheck = await pool.query(
      "SELECT * FROM rooms WHERE id = $1 AND location_id = $2",
      [room_id, location_id]
    );
    if (roomCheck.rowCount === 0) {
      return Response.json(
        {
          success: false,
          message: "Ruangan tidak ditemukan di lokasi yang dipilih.",
        },
        { status: 400 }
      );
    }

    // Handle file KTP
    let ktp_file_path = null;
    let fileBuffer = null;
    let filename = null;

    if (ktp_file && typeof ktp_file === "object") {
      const arrayBuffer = await ktp_file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      const ext = path.extname(ktp_file.name) || ".jpg";
      filename = `ktp_${tenant_name}_${moment(Date.now()).format(
        "YYYY_MM_DD_HH_mm_ss"
      )}${ext}`;
      ktp_file_path = `/uploads/ktp/${filename}`;
    } else if (ktp_file_path_old) {
      ktp_file_path = ktp_file_path_old;
    } else {
      return Response.json(
        {
          success: false,
          message: "Silakan upload gambar KTP terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    // Normalisasi angka
    const total_payment_num = total_payment ? Number(total_payment) : 0;
    const down_payment_num = down_payment ? Number(down_payment) : 0;
    const remaining_payment_num = remaining_payment
      ? Number(remaining_payment)
      : 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        UPDATE tenant_application
        SET
        location_id = $1,
        room_id = $2,
        tenant_name = $3,
        tenant_nik = $4,
        tenant_phone = $5,
        payment_type = $6,
        total_payment = $7,
        down_payment = $8,
        remaining_payment = $9,
        approval_status = $10,
        current_step = $11,
        user_id = $12,
        ktp_file_path = $13
        WHERE id = $14
        RETURNING *
        `,
        [
          location_id,
          room_id,
          tenant_name,
          tenant_nik,
          tenant_phone,
          payment_type,
          total_payment_num,
          down_payment_num,
          remaining_payment_num,
          approval_status,
          stepToUse,
          user_id,
          ktp_file_path,
          id,
        ]
      );

      // Update room availability
      if (oldRoomId !== room_id) {
        // Room lama jadi false
        await client.query(
          `UPDATE rooms SET is_available = false, updated_at = NOW() WHERE id = $1`,
          [oldRoomId]
        );
      }

      // Room baru jadi true
      await client.query(
        `UPDATE rooms SET is_available = true, updated_at = NOW() WHERE id = $1`,
        [room_id]
      );

      // Update tenant_approval: reset hanya yang belum approve
      await client.query(
        `
  UPDATE tenant_approval
  SET approver_id = NULL,
      approved_at = NULL,
      status = 'pending',
      notes = NULL
  WHERE tenant_application_id = $1
    AND status <> 'approved'  -- ⬅️ hanya pending / rejected
  `,
        [id]
      );
      await client.query("COMMIT");

      // Simpan file baru kalau ada
      if (fileBuffer && filename) {
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, fileBuffer);
      }

      return Response.json(
        {
          success: true,
          message:
            "Data tenant berhasil diperbarui & status ruangan diperbarui.",
          data: result.rows[0],
        },
        { status: 200 }
      );
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error update tenant:", err);
    return Response.json(
      { success: false, message: "Terjadi error: " + err.message },
      { status: 500 }
    );
  }
}

// DELETE Tenant Application
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    // Ambil data tenant_application sebelum dihapus
    const tenantRes = await pool.query(
      `SELECT room_id, ktp_file_path FROM tenant_application WHERE id = $1`,
      [id]
    );

    if (tenantRes.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Penyewa tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const { room_id, ktp_file_path } = tenantRes.rows[0];

    // Hapus tenant_approval terkait
    await pool.query(
      `DELETE FROM tenant_approval WHERE tenant_application_id=$1`,
      [id]
    );

    // Hapus tenant_application
    const result = await pool.query(
      `DELETE FROM tenant_application WHERE id=$1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal menghapus Data Penyewa",
        }),
        { status: 400 }
      );
    }

    // Update room agar kembali available
    await pool.query(`UPDATE rooms SET is_available = false WHERE id = $1`, [
      room_id,
    ]);

    // Hapus file KTP jika ada
    if (ktp_file_path) {
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads/ktp",
        path.basename(ktp_file_path)
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        console.log("File KTP tidak ditemukan:", filePath);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menghapus Data Penyewa dan Ruangan tersedia kembali",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("Error delete Data Penyewa", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
