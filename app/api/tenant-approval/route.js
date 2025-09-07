import pool from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantAppId = searchParams.get("id");

    console.log('tenantAppId', tenantAppId);
    

    if (!tenantAppId) {
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
        ta.id AS approval_id,
        ta.tenant_application_id,
        ta.role_id,
        ta.approver_id,
        ta.step_order,
        ta.status,
        ta.notes,
        ta.approved_at,
        r.role_name,
        u.id AS user_id,
        u.full_name
      FROM tenant_approval ta
      JOIN roles r ON ta.role_id = r.id
      LEFT JOIN users u ON ta.approver_id = u.id
      WHERE ta.tenant_application_id = $1
      ORDER BY ta.step_order ASC
      `,
      [tenantAppId]
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
