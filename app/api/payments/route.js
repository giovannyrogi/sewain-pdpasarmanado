import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";

// Konfigurasi upload folder
const uploadDir = path.join(
  process.cwd(),
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
    const ppnAmount = formData.get("ppn_amount");
    const payment_type = formData.get("payment_type");
    const contract_amount = formData.get("contract_amount");

    // Kondisi untuk remaining balance
    let remainingBalance = 0;
    if (payment_type === "cicilan") {
      remainingBalance = formData.get("remaining_balance") || 0;
    }

    if (!proofFile || typeof proofFile !== "object") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "File bukti transfer wajib diunggah",
        }),
        { status: 400 }
      );
    }

    // --- Generate nama file saja (belum simpan file)
    const arrayBuffer = await proofFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const ext = path.extname(proofFile.name) || ".jpg";
    const filename = `bukti_transfer_${tenantName.replace(
      /\s+/g,
      "_"
    )}_${moment().format("YYYY_MM_DD_HH_mm_ss")}${ext}`;
    const filePath = path.join(uploadDir, filename);
    const proofFilePath = `/api/uploads/bukti_transfer/${filename}`;

    // --- Transaksi supaya konsisten
    await client.query("BEGIN");

    // Insert ke table payments
    const insertPaymentQuery = `
      INSERT INTO payments 
        (tenant_application_id, payment_number, amount, payment_date, proof_file_path, uploaded_by, approval_status, ppn_amount, remaining_balance, contract_amount)
      VALUES ($1, $2, $3, $4, $5, $6, 'proses', $7, $8, $9)
      RETURNING id;
    `;

    const paymentValues = [
      tenantApplicationId,
      paymentNumber,
      amount,
      moment(paymentDate).format("YYYY-MM-DD"),
      proofFilePath,
      uploadedBy,
      ppnAmount,
      remainingBalance,
      contract_amount,
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
        -- payments
        p.id AS payment_id,
        p.payment_date,
        p.amount AS payment_amount,
        p.proof_file_path,
        p.payment_number,
        p.approval_status,
        p.uploaded_by,
        p.ppn_amount,
        p.contract_amount,
        p.remaining_balance,

        -- Subquery: pembayaran sebelumnya
        (
          SELECT json_agg(
            json_build_object(
              'payment_id', p2.id,
              'payment_number', p2.payment_number,
              'amount', p2.amount,
              'ppn_amount', p2.ppn_amount,
              'contract_amount', p2.contract_amount,
              'remaining_balance', p2.remaining_balance,
              'payment_date', p2.payment_date,
              'proof_file_path', p2.proof_file_path
            )
            ORDER BY p2.payment_number
          )
          FROM payments p2
          WHERE p2.tenant_application_id = p.tenant_application_id
            AND p2.payment_number < p.payment_number
        ) AS previous_payments,

        -- tenant_application
        ta.id AS tenant_application_id,
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
        ta.total_payment_room,
        ta.admin_fee,

        -- tenant_identities 
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
        ti.ktp_file_path,

        -- rooms
        rm.id AS room_id,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,

        -- location floor prices
        lfp.floor,

        -- location
        loc.location_name,
        loc.street_address,
        loc.city,

        -- payment approval
        pa.id,
        pa.payment_id,
        pa.role_id AS payment_approval_role_id,
        pa.status AS payment_approval_status2,
        pa.approver_id AS payment_approver_id,
        pa.notes AS payment_notes,
        pa.approved_at AS payment_approved_at,
        pa.created_at AS payment_approval_created_at,
        pa.updated_at AS payment_approval_updated_at

      FROM payments p
      LEFT JOIN tenant_application ta ON ta.id = p.tenant_application_id
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      LEFT JOIN rooms rm ON rm.id = ta.room_id
      LEFT JOIN locations loc ON loc.id = ta.location_id
      LEFT JOIN location_floor_prices lfp ON lfp.id = rm.floor_id
      LEFT JOIN payment_approval pa ON pa.payment_id = p.id
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
      ORDER BY p.id;
    `;

    const result = await pool.query(sql);

    const rows = result.rows.map((row) => {
      return {
        tenant_application: {
          tenant_application_id: row.tenant_application_id,
          tenant_name: row.tenant_name,
          tenant_nik: row.tenant_nik,
          tenant_phone: row.tenant_phone,
          ktp_file_path: row.ktp_file_path,
          start_date: row.start_date
            ? moment(row.start_date).format("YYYY-MM-DD")
            : null,
          end_date: row.end_date
            ? moment(row.end_date).format("YYYY-MM-DD")
            : null,
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
          total_payment_room: row.total_payment_room,
          admin_fee: row.admin_fee,
        },
        payments: {
          payment_id: row.payment_id,
          payment_date: row.payment_date
            ? moment(row.payment_date).format("YYYY-MM-DD")
            : null,
          payment_amount: row.payment_amount,
          proof_file_path: row.proof_file_path,
          payment_number: row.payment_number,
          approval_status: row.approval_status,
          uploaded_by: row.uploaded_by,
          ppn_amount: row.ppn_amount,
          contract_amount: row.contract_amount,
          remaining_balance: row.remaining_balance,
          previous_payments: row.previous_payments || [],
        },
        payment_approval: {
          id: row.id,
          payment_id: row.payment_id,
          role_id: row.payment_approval_role_id,
          status: row.payment_approval_status2,
          approver_id: row.payment_approver_id,
          notes: row.payment_notes,
          approved_at: row.payment_approved_at
            ? moment(row.payment_approved_at).format("YYYY-MM-DD HH:mm:ss")
            : null,
          created_at: row.payment_approval_created_at,
          updated_at: row.payment_approval_updated_at,
        },
        room: {
          room_id: row.room_id,
          room_number: row.room_number,
          floor_id: row.floor_id,
          room_length: row.room_length,
          room_width: row.room_width,
          room_area: row.room_area,
          price_per_m2: row.price_per_m2,
          floor: row.floor,
        },
        location: {
          location_name: row.location_name,
          street_address: row.street_address,
          city: row.city,
        },
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data payments + approvals",
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
