import pool from "@/lib/dbConfig";
import path from "path";
import fs from "fs";
import moment from "moment";

const uploadDir = path.join(process.cwd(), "uploads", "bukti_transfer");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const client = await pool.connect();

  try {
    const formData = await req.formData();
    const tenantName = formData.get("tenant_name") || "tenant";

    // Ambil data payment lama
    const oldPaymentRes = await client.query(
      `SELECT p.*, pa.id AS payment_approval_id 
       FROM payments p 
       LEFT JOIN payment_approval pa ON pa.payment_id = p.id
       WHERE p.id = $1`,
      [id]
    );

    if (oldPaymentRes.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data payment tidak ditemukan.",
        }),
        { status: 404 }
      );
    }

    const oldData = oldPaymentRes.rows[0];
    let proofFilePath = oldData.proof_file_path; // default pakai data lama
    let newFilePath = null;
    let oldFilePathToDelete = null;

    // Ambil data form
    const amount = formData.get("amount");
    const contractAmount = formData.get("contract_amount");
    const ppnAmount = formData.get("ppn_amount");
    const remainingBalance = formData.get("remaining_balance");
    const uploadedBy = formData.get("uploaded_by");
    const approvalStatus = "proses";
    const paymentDate =
      formData.get("payment_date") ||
      moment(oldData.payment_date).format("YYYY-MM-DD");
    const proofFile = formData.get("proof_file");
    const payment_approval_id = formData.get("payment_approval_id");

    // validasi status hanya proses atau rejected
    if (!approvalStatus === "proses" || !approvalStatus === "rejected") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Status tidak valid",
        }),
        { status: 400 }
      );
    }

    // validasi data wajib
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter id (payment_id) wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!payment_approval_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter id (payment_approval_id) wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!proofFile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bukti transfer wajib diisi",
        }),
        { status: 400 }
      );
    }

    if (!paymentDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tanggal Pembayaran wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Cek apakah ada file baru
    let fileBuffer = null;
    let filename = null;
    if (proofFile && typeof proofFile === "object") {
      const ext = path.extname(proofFile.name) || ".jpg";
      filename = `bukti_transfer_${tenantName.replace(
        /\s+/g,
        "_"
      )}_${moment().format("YYYY_MM_DD_HH_mm_ss")}${ext}`;
      newFilePath = path.join(uploadDir, filename);
      proofFilePath = `/uploads/bukti_transfer/${filename}`;

      oldFilePathToDelete = path.join(
        process.cwd(),
        oldData.proof_file_path.replace(/^\/+/, "")
      );

      const arrayBuffer = await proofFile.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }

    // Mulai transaksi
    await client.query("BEGIN");

    // Update data payments
    const updateQuery = `
      UPDATE payments
      SET amount = $1,
          contract_amount = $2,
          ppn_amount = $3,
          remaining_balance = $4,
          uploaded_by = $5,
          approval_status = $6,
          payment_date = $7,
          proof_file_path = $8
      WHERE id = $9
    `;
    const updateValues = [
      amount,
      contractAmount,
      ppnAmount,
      remainingBalance,
      uploadedBy,
      approvalStatus,
      moment(paymentDate).format("YYYY-MM-DD"),
      proofFilePath,
      id,
    ];

    await client.query(updateQuery, updateValues);

    // Update status approval di tabel payment_approval
    if (payment_approval_id) {
      await client.query(
        `UPDATE payment_approval
         SET status = 'pending', approver_id = NULL, notes = NULL, approved_at = NULL
         WHERE id = $1`,
        [payment_approval_id]
      );
    }

    // Commit sebelum operasi file
    await client.query("COMMIT");

    // === Setelah DB berhasil, baru proses file ===
    if (fileBuffer && newFilePath) {
      fs.writeFileSync(newFilePath, fileBuffer);

      // Hapus file lama (jika ada dan berbeda)
      if (oldFilePathToDelete && fs.existsSync(oldFilePathToDelete)) {
        try {
          fs.unlinkSync(oldFilePathToDelete);
        } catch (err) {
          console.error("Gagal hapus file lama:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data pembayaran berhasil diperbarui.",
        updated_id: id,
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error update payment:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params; // payment_id dari URL
  try {
    // Ambil data payment
    const findPaymentQuery = `
      SELECT id, proof_file_path
      FROM payments
      WHERE id = $1
    `;
    const findPaymentResult = await pool.query(findPaymentQuery, [id]);
    if (findPaymentResult.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data pembayaran tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const payment = findPaymentResult.rows[0];
    const proofFilePath = payment.proof_file_path;

    // Hapus data payment_approval
    const deleteApprovalQuery = `DELETE FROM payment_approval WHERE payment_id = $1`;
    await pool.query(deleteApprovalQuery, [id]);

    // Hapus data payments
    const deletePaymentQuery = `DELETE FROM payments WHERE id = $1`;
    await pool.query(deletePaymentQuery, [id]);

    // Hapus file bukti transfer jika ada
    if (proofFilePath) {
      const absolutePath = path.join(
        process.cwd(),
        proofFilePath.replace(/^\/+/, "")
      );

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bukti pembayaran berhasil dihapus",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error delete payment", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
