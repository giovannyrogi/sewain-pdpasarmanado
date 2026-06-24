import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const ACCESS_ROLES = [1, 8, 9];

export async function GET(request) {
  try {
    const { response } = await requireRole(ACCESS_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const paymentId = Number(searchParams.get("id"));
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return Response.json(
        { success: false, message: "ID pembayaran tidak valid." },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      SELECT
        approval.id AS payment_approval_id,
        approval.land_permit_payment_id AS payment_id,
        approval.role_id,
        approval.step_order,
        approval.status,
        approval.notes,
        approval.approved_at,
        approval.proof_verified_file_path,
        role.role_name,
        approver.id AS user_id,
        approver.full_name
      FROM land_permit_payment_approval approval
      JOIN roles role ON role.id = approval.role_id
      LEFT JOIN users approver ON approver.id = approval.approver_id
      WHERE approval.land_permit_payment_id = $1
      ORDER BY approval.step_order ASC
      `,
      [paymentId],
    );

    return Response.json({
      success: true,
      message: "Berhasil mengambil tracking pembayaran izin lahan.",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching land permit payment approval:", error);
    return Response.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil tracking pembayaran izin lahan.",
      },
      { status: 500 },
    );
  }
}
