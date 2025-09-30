import pool from "@/lib/dbConfig";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id payment_approval
    const body = await request.json();
    const { payment_id, status, approver_id, role_id, tenant_application_id, payment_type } =
      body;

    // Validasi input status
    if (!["approved"].includes(status)) {
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

    const paymentData = paymentRes.rows[0];

    // Update tabel payment_approval
    const updateApproval = await pool.query(
      `UPDATE payment_approval 
       SET status=$1, approver_id=$2, approved_at=$3
       WHERE id=$4 AND payment_id=$5
       RETURNING *`,
      [status, approver_id, new Date(), id, payment_id]
    );

    // Update tabel payments.approval_status
    await pool.query(
      `UPDATE payments 
       SET approval_status=$1
       WHERE id=$2`,
      [status, payment_id]
    );

    // Jika payment_number == 3, set tenant_application.is_fully_paid = true
    if (paymentData.payment_number === 3 || payment_type === "lunas") {
      await pool.query(
        `UPDATE tenant_application 
         SET is_fully_paid = true
         WHERE id = $1`,
        [tenant_application_id]
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment Approval berhasil diproses",
        data: updateApproval.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error update Payment Approval", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
