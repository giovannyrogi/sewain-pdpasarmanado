import fs from "fs";
import path from "path";
import pool from "@/lib/dbConfig";
import moment from "moment";

// Pastikan upload directory ada
const uploadDir = path.join(process.cwd(), "public/uploads/ktp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    // Ambil fields dari formData
    const location_id = formData.get("location_id");
    const room_id = formData.get("room_id");
    const tenant_name = formData.get("tenant_name");
    const tenant_nik = formData.get("tenant_nik");
    const tenant_phone = formData.get("tenant_phone");
    const start_date = formData.get("start_date");
    const end_date = formData.get("end_date");
    const payment_type = formData.get("payment_type");
    const total_payment = formData.get("total_payment");
    const down_payment = formData.get("down_payment");
    const remaining_payment = formData.get("remaining_payment");
    const approval_status = formData.get("approval_status");
    const ktp_file = formData.get("ktp_file");
    const user_id = formData.get("user_id");
    const current_step = formData.get("current_step");
    const estimated_installment_1 = formData.get("estimated_installment_1");
    const estimated_installment_2 = formData.get("estimated_installment_2");
    const estimated_installment_3 = formData.get("estimated_installment_3");
    const estimated_installment_1_date = formData.get(
      "estimated_installment_date_1"
    );
    const estimated_installment_2_date = formData.get(
      "estimated_installment_date_2"
    );
    const estimated_installment_3_date = formData.get(
      "estimated_installment_date_3"
    );

    const total = Number(total_payment) || 0;
    const minDp = Math.round(total * 0.4);
    const dp = Number(down_payment) || 0;

    // Validasi DP minimal 40% dari total
    if (payment_type === "cicilan" && dp < minDp) {
      return Response.json(
        { success: false, message: "DP minimal 40% dari total pembayaran." },
        { status: 400 }
      );
    }

    // Validasi DP tidak boleh lebih besar dari total
    if (dp > total) {
      return Response.json(
        {
          success: false,
          message: "DP tidak boleh lebih besar dari total pembayaran.",
        },
        { status: 400 }
      );
    }

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

    // Sebelum insert, cek tenant_nik
    // const existingNik = await pool.query(
    //   "SELECT id FROM tenant_application WHERE tenant_nik = $1",
    //   [tenant_nik]
    // );

    // if (existingNik.rowCount > 0) {
    //   return Response.json(
    //     { success: false, message: "NIK sudah terdaftar." },
    //     { status: 400 }
    //   );
    // }

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

    // Siapkan file (hanya di memory, belum ditulis)
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
    }

    // Normalisasi nilai numeric
    const total_payment_num = total_payment ? Number(total_payment) : 0;
    const down_payment_num = down_payment ? Number(down_payment) : 0;
    const remaining_payment_num = remaining_payment
      ? Number(remaining_payment)
      : 0;

    // Insert ke database
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        INSERT INTO tenant_application (
          location_id,
          room_id,
          tenant_name,
          tenant_nik,
          tenant_phone,
          payment_type,
          total_payment,
          down_payment,
          remaining_payment,
          approval_status,
          ktp_file_path,
          user_id,
          current_step,
          estimated_installment_1,
          estimated_installment_2,
          estimated_installment_3,
          estimated_installment_1_date,
          estimated_installment_2_date,
         estimated_installment_3_date
          
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19
        )
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
          ktp_file_path,
          user_id,
          current_step,
          estimated_installment_1,
          estimated_installment_2,
          estimated_installment_3,
          estimated_installment_1_date,
          estimated_installment_2_date,
          estimated_installment_3_date,
        ]
      );

      // Ambil tenant_application_id hasil insert
      const tenantApp = result.rows[0];
      const tenantAppId = tenantApp.id;

      // Insert ke tenant_approval sesuai urutan step role
      const approvals = [
        { role_id: 3, step_order: 1 }, // kasie
        { role_id: 4, step_order: 2 }, // kasubdiv
        { role_id: 5, step_order: 3 }, // kadiv
        { role_id: 6, step_order: 4 }, // dirbis
        { role_id: 7, step_order: 5 }, // dirut
      ];

      for (const a of approvals) {
        await client.query(
          `INSERT INTO tenant_approval (
      tenant_application_id,
      role_id,
      step_order,
      status
    ) VALUES ($1, $2, $3, $4)`,
          [tenantAppId, a.role_id, a.step_order, "pending"]
        );
      }

      // Update rooms -> is_available = true
      await client.query(
        `UPDATE rooms SET is_available = true, updated_at = NOW() WHERE id = $1`,
        [room_id]
      );

      // Jika semua sukses → commit
      await client.query("COMMIT");

      // Baru tulis file ke folder
      if (fileBuffer && filename) {
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, fileBuffer);
      }

      return Response.json(
        {
          success: true,
          message: "Permohonan berhasil ditambahkan & ruangan diperbarui.",
          data: result.rows[0],
        },
        { status: 201 }
      );
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error upload/insert:", err);
    return Response.json(
      { success: false, message: "Terjadi error: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const result = await pool.query(
      `SELECT
        ta.id AS tenant_application_id,
        ta.tenant_name,
        ta.tenant_nik,
        ta.tenant_phone,
        ta.ktp_file_path,
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.down_payment,
        ta.remaining_payment,
        ta.approval_status,
        ta.current_step,
        ta.user_id,
        ta.updated_at,
        ta.created_at,
        ta.estimated_installment_1,
        ta.estimated_installment_2,
        ta.estimated_installment_3,
        ta.estimated_installment_1_date,
        ta.estimated_installment_2_date,
        ta.estimated_installment_3_date,
        ta.document_number,
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
        f.floor,
        tet.is_terminated  
      FROM tenant_application ta
      JOIN rooms r ON ta.room_id = r.id
      JOIN locations l ON ta.location_id = l.id
      LEFT JOIN location_floor_prices f ON r.floor_id = f.id
      LEFT JOIN tenant_early_terminations tet ON tet.tenant_application_id = ta.id 
      WHERE tet.is_terminated = false
      OR tet.is_terminated IS NULL
      ORDER BY ta.created_at DESC`
    );

    const rows = result.rows.map((row) => ({
      tenant_application_id: row.tenant_application_id,
      user_id: row.user_id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
      start_date: row.start_date,
      end_date: row.end_date,
      estimated_installment_1: row.estimated_installment_1,
      estimated_installment_2: row.estimated_installment_2,
      estimated_installment_3: row.estimated_installment_3,
      estimated_installment_1_date: row.estimated_installment_1_date,
      estimated_installment_2_date: row.estimated_installment_2_date,
      estimated_installment_3_date: row.estimated_installment_3_date,
      document_number: row.document_number,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      approval_status: row.approval_status,
      location_id: row.location_id,
      location_name: row.location_name,
      room_id: row.room_id,
      room_number: row.room_number,
      floor_id: row.floor_id,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      price_per_m2: row.price_per_m2,
      current_step: row.current_step,
      base_price: row.base_price,
      floor: row.floor,
      is_terminated: row.is_terminated ?? false, // default false jika null
      created_at: moment(row.created_at).format("D MMMM YYYY"),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant application",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error", err);

    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
