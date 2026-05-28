import pool from "@/lib/dbConfig";

export async function PUT(request, { params }) {
  try {
    const { id } = params; // id payment_approval dari URL
    const body = await request.json();
    const { notes, status, approver_id, payment_id, role_id } = body;

    if (!notes) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Alasan penolakan wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Validasi input status
    if (!["rejected"].includes(status)) {
      return new Response(
        JSON.stringify({ success: false, message: "Status tidak valid" }),
        { status: 400 }
      );
    }

    // Ambil data payment_approval
    const approvalRes = await pool.query(
      `SELECT * FROM payment_approval WHERE id=$1`,
      [id]
    );
    if (approvalRes.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Payment Approval tidak ditemukan",
        }),
        { status: 404 }
      );
    }
    const approvalData = approvalRes.rows[0];

    // Cek apakah role_id login sama dengan role_id di payment_approval
    if (approvalData.role_id !== role_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Anda tidak memiliki akses untuk approval ini",
        }),
        { status: 403 }
      );
    }

    // Cek data payment
    const paymentRes = await pool.query(`SELECT * FROM payments WHERE id=$1`, [
      payment_id,
    ]);
    if (paymentRes.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Payment tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    // Update payment_approval → rejected
    const updateApproval = await pool.query(
      `UPDATE payment_approval 
       SET status=$1, notes=$2, approver_id=$3, approved_at=NOW(), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, notes, approver_id, id]
    );

    // Update juga tabel payments → approval_status = 'rejected'
    await pool.query(
      `UPDATE payments 
       SET approval_status='rejected', updated_at=NOW() 
       WHERE id=$1`,
      [payment_id]
    );

    await pool.query(
      `UPDATE payment_receipts
       SET status = 'rejected',
           approved_at = NOW(),
           approved_by = $1,
           updated_at = NOW()
       WHERE payment_id = $2`,
      [approver_id, payment_id]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Bukti pembayaran berhasil ditolak!",
        data: updateApproval.rows[0],
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error update payment_approval:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan server",
      }),
      { status: 500 }
    );
  }
}
