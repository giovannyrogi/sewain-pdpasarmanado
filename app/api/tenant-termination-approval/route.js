import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

const NON_FINANCE_ROLES = [1, 2, 3, 4, 5, 6, 7];

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (!NON_FINANCE_ROLES.includes(Number(user.role_id))) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Anda tidak memiliki akses ke detail approval terminasi.",
        }),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const terminationId = Number(searchParams.get("id")); // tenant_early_termination_id

    if (!Number.isInteger(terminationId) || terminationId <= 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Parameter id nonaktif tenant tidak valid" }),
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
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan saat mengambil progress approval terminasi.",
      }),
      { status: 500 }
    );
  }
}
