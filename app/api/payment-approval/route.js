import pool from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("id");

    if (!paymentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter id (tenant_application_id) wajib diisi",
        }),
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        pa.id AS payment_approval_id,
        pa.payment_id,
        pa.role_id,
        pa.approver_id,
        pa.step_order,
        pa.status,
        pa.notes,
        pa.approved_at,
        pa.proof_verified_file_path,
        r.role_name,
        u.id AS user_id,
        u.full_name
      FROM payment_approval pa
      JOIN roles r ON pa.role_id = r.id
      LEFT JOIN users u ON pa.approver_id = u.id
      WHERE pa.payment_id = $1
      ORDER BY pa.step_order ASC
      `,
      [paymentId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant approval",
        data: result.rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant-approval:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
