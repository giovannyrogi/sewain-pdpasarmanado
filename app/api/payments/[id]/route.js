import pool from "@/lib/dbConfig";
import fs from "fs";
import path from "path";

export async function DELETE(req, { params }) {
  const { id } = params; // payment_id dari URL
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
      // proofFilePath contoh: /uploads/bukti_transfer/nama_file.jpg
      // kita ambil path absolut di server
      const absolutePath = path.join(process.cwd(), "public", proofFilePath);
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
