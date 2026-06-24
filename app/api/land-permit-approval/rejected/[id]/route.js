import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  normalizeRequiredString,
} from "@/app/utils/apiValidation";
import {
  lockApprovalContext,
  parseApprovalRequest,
  releaseLandStall,
  validateApprovalTurn,
} from "../../approvalHelpers";
import {
  getLandPermitNotificationContext,
  notifyLandPermitApprovalActionCompleted,
  notifyLandPermitApprovalRejected,
} from "@/app/utils/notifications";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const parsed = await parseApprovalRequest(request, params);
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

    const context = await lockApprovalContext(
      client,
      parsed.approvalId,
      parsed.applicationId,
    );
    const turnError = await validateApprovalTurn(client, context, user);
    if (turnError) {
      await client.query("ROLLBACK");
      return failResponse(turnError, 409);
    }

    const approval = await client.query(
      `
      UPDATE land_permit_approval
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
      UPDATE land_permit_applications
      SET approval_status = 'rejected',
          updated_at = NOW()
      WHERE id = $1
      `,
      [parsed.applicationId],
    );
    await releaseLandStall(client, context.stall_id);

    const notificationContext = await getLandPermitNotificationContext(
      client,
      parsed.applicationId,
    );
    if (notificationContext) {
      await notifyLandPermitApprovalActionCompleted(
        client,
        notificationContext,
        user.id,
        context.role_id,
        "rejected",
      );
      await notifyLandPermitApprovalRejected(
        client,
        notificationContext,
        user.id,
      );
    }

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: "Permohonan izin lahan berhasil ditolak.",
      data: approval.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error rejecting land permit application",
      error,
      "Terjadi kesalahan saat menolak permohonan izin lahan.",
    );
  } finally {
    client.release();
  }
}
