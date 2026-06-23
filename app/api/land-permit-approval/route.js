import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

const LAND_PERMIT_APPROVAL_TRACKING_ROLES = [1, 3, 4, 5, 6, 7, 9];

export async function GET(request) {
  try {
    const { response } = await requireRole(LAND_PERMIT_APPROVAL_TRACKING_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const { value: applicationId, error } = parsePositiveInteger(
      searchParams.get("id"),
      "ID permohonan izin lahan",
    );
    if (error) return failResponse(error, 400);

    const result = await pool.query(
      `
      SELECT
        lpa.id AS approval_id,
        lpa.land_permit_application_id,
        lpa.role_id,
        r.role_name,
        lpa.step_order,
        lpa.status,
        lpa.notes,
        lpa.approved_at,
        lpa.created_at,
        lpa.updated_at,
        u.full_name,
        u.username
      FROM land_permit_approval lpa
      JOIN roles r ON r.id = lpa.role_id
      LEFT JOIN users u ON u.id = lpa.approver_id
      WHERE lpa.land_permit_application_id = $1
      ORDER BY lpa.step_order ASC
      `,
      [applicationId],
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil tracking approval izin lahan.",
      data: result.rows,
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land permit approval tracking",
      error,
      "Terjadi kesalahan saat mengambil tracking approval izin lahan.",
    );
  }
}
