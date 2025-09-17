import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";

// Konfigurasi upload folder
const uploadDir = path.join(
  process.cwd(),
  "public",
  "uploads",
  "bukti_transfer"
);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const formData = await req.formData();
    const tenantApplicationId = formData.get("tenant_application_id");
    const amount = formData.get("amount");
    const paymentNumber = formData.get("payment_number") || 1;
    const paymentDate = formData.get("payment_date");
    const tenantName = formData.get("tenant_name") || "tenant";
    const proofFile = formData.get("proof_file");
    const uploadedBy = formData.get("uploaded_by");

    if (!proofFile || typeof proofFile !== "object") {
      return new Response(
        JSON.stringify({ success: false, message: "File bukti transfer wajib diunggah" }),
        { status: 400 }
      );
    }

    // --- Generate nama file saja (belum simpan file)
    const arrayBuffer = await proofFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const ext = path.extname(proofFile.name) || ".jpg";
    const filename = `bukti_transfer_${tenantName.replace(/\s+/g, "_")}_${moment().format("YYYY_MM_DD_HH_mm_ss")}${ext}`;
    const filePath = path.join(uploadDir, filename);
    const proofFilePath = `/uploads/bukti_transfer/${filename}`;

    // --- Transaksi supaya konsisten
    await client.query("BEGIN");

    // Insert ke table payments
    const insertPaymentQuery = `
      INSERT INTO payments 
        (tenant_application_id, payment_number, amount, payment_date, proof_file_path, uploaded_by, approval_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'proses')
      RETURNING id;
    `;
    const paymentValues = [
      tenantApplicationId,
      paymentNumber,
      amount,
      moment(paymentDate).format("YYYY-MM-DD"),
      proofFilePath,
      uploadedBy,
    ];
    const paymentResult = await client.query(insertPaymentQuery, paymentValues);
    const paymentId = paymentResult.rows[0].id;

    // Insert ke payment_approval otomatis
    const insertApprovalQuery = `
      INSERT INTO payment_approval (payment_id, role_id, step_order, status)
      VALUES ($1, 8, 1, 'pending')
      RETURNING id;
    `;
    await client.query(insertApprovalQuery, [paymentId]);

    // --- Commit DB baru tulis file
    await client.query("COMMIT");

    // Simpan file setelah DB berhasil
    fs.writeFileSync(filePath, fileBuffer);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil upload bukti pembayaran, silahkan menunggu approval",
        payment_id: paymentId,
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error insert payment", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


export async function GET() {
  try {
    const sql = `
      SELECT
        p.id AS payment_id,
        p.payment_date,
        p.amount AS payment_amount,
        p.proof_file_path,
        p.payment_number,
        p.approval_status AS payment_approval_status,
        p.uploaded_by,

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
        ta.current_payment_step,   

        rm.id AS room_id,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,

        lfp.floor,
        lfp.base_price,

        loc.location_name,
        loc.address AS location_address,
        loc.city AS location_city

      FROM payments p
      LEFT JOIN tenant_application ta ON ta.id = p.tenant_application_id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
      ORDER BY p.id;
    `;

    const result = await pool.query(sql);

    const rows = result.rows.map((row) => ({
      ...row,
      start_date: row.start_date
        ? moment(row.start_date).format("YYYY-MM-DD")
        : null,
      end_date: row.end_date ? moment(row.end_date).format("YYYY-MM-DD") : null,
      payment_date: row.payment_date
        ? moment(row.payment_date).format("YYYY-MM-DD")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data payments",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
