import pool from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const terminationId = searchParams.get("id"); // tenant_early_termination_id

    if (!terminationId) {
      return new Response(
        JSON.stringify({ success: false, message: "Parameter id (tenant_early_termination_id) wajib diisi" }),
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        tta.id AS approval_id,
        tta.tenant_early_termination_id,
        tta.role_id,
        tta.approver_id,
        tta.step_order,
        tta.status,
        tta.notes,
        tta.approved_at,
        r.role_name,
        u.id AS user_id,
        u.full_name
      FROM tenant_termination_approval tta
      JOIN roles r ON tta.role_id = r.id
      LEFT JOIN users u ON tta.approver_id = u.id
      WHERE tta.tenant_early_termination_id = $1
      ORDER BY tta.step_order ASC
      `,
      [terminationId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data termination approval",
        data: result.rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant termination approval:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
