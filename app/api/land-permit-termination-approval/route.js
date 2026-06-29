import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 3, 4, 5, 6, 7, 9];

export async function GET(request) {
  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const terminationId = Number(searchParams.get("id"));

    if (!Number.isInteger(terminationId) || terminationId <= 0) {
      return Response.json(
        { success: false, message: "ID non-aktif izin lahan tidak valid." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      SELECT
        approval.id AS termination_approval_id,
        approval.land_permit_termination_id,
        approval.role_id,
        approval.step_order,
        approval.status,
        approval.notes,
        approval.approved_at,
        role.role_name,
        approver.id AS user_id,
        approver.full_name
      FROM land_permit_termination_approval approval
      JOIN roles role ON role.id = approval.role_id
      LEFT JOIN users approver ON approver.id = approval.approver_id
      WHERE approval.land_permit_termination_id = $1
      ORDER BY approval.step_order ASC
      `,
      [terminationId],
    );

    return Response.json({
      success: true,
      message: "Berhasil mengambil tracking non-aktif izin lahan.",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching land permit termination approval:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil tracking non-aktif izin lahan.",
      },
      { status: 500 },
    );
  }
}
