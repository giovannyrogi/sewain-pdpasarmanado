import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  normalizeRequiredString,
} from "@/app/utils/apiValidation";
import {
  lockTerminationApprovalContext,
  parseTerminationApprovalRequest,
  validateTerminationApprovalTurn,
} from "../../approvalHelpers";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const parsed = await parseTerminationApprovalRequest(request, params);
    if (parsed.response) return parsed.response;

    const notes = normalizeRequiredString(
      parsed.body?.notes,
      "Alasan penolakan",
      { max: 250 },
    );
    if (notes.error) {
      return failResponse(notes.error, 400);
    }

    await client.query("BEGIN");

    const context = await lockTerminationApprovalContext(
      client,
      parsed.approvalId,
      parsed.terminationId,
    );
    const turnError = await validateTerminationApprovalTurn(
      client,
      context,
      user,
    );
    if (turnError) {
      await client.query("ROLLBACK");
      return failResponse(turnError, 409);
    }

    const approval = await client.query(
      `
      UPDATE land_permit_termination_approval
      SET status = 'rejected',
          notes = $1,
          approver_id = $2,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [notes.value, user.id, parsed.approvalId],
    );

    await client.query(
      `
      UPDATE land_permit_terminations
      SET approval_status = 'rejected',
          updated_at = NOW()
      WHERE id = $1
      `,
      [parsed.terminationId],
    );

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: "Pengajuan non-aktif izin lahan berhasil ditolak.",
      data: approval.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error rejecting land permit termination",
      error,
      "Terjadi kesalahan saat menolak pengajuan non-aktif izin lahan.",
    );
  } finally {
    client.release();
  }
}
