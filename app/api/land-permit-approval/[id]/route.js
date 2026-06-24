import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import {
  lockApprovalContext,
  parseApprovalRequest,
  validateApprovalTurn,
} from "../approvalHelpers";
import {
  getLandPermitNotificationContext,
  notifyLandPermitApprovalActionCompleted,
  notifyLandPermitApprovalMoved,
} from "@/app/utils/notifications";

const NEXT_ROLE_BY_STEP = {
  2: 4,
  3: 5,
  4: 6,
  5: 7,
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const parsed = await parseApprovalRequest(request, params);
    if (parsed.response) return parsed.response;

    if (parsed.body?.status !== "approved") {
      return failResponse("Status approval tidak valid.", 400);
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

    const maxStepResult = await client.query(
      `
      SELECT MAX(step_order)::int AS max_step
      FROM land_permit_approval
      WHERE land_permit_application_id = $1
      `,
      [parsed.applicationId],
    );
    const maxStep = maxStepResult.rows[0]?.max_step || 5;
    const isFinalStep = Number(context.step_order) === Number(maxStep);

    const approval = await client.query(
      `
      UPDATE land_permit_approval
      SET status = 'approved',
          notes = NULL,
          approver_id = $1,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [user.id, parsed.approvalId],
    );

    await client.query(
      `
      UPDATE land_permit_applications
      SET current_step = $1,
          approval_status = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [
        isFinalStep ? context.step_order : Number(context.step_order) + 1,
        isFinalStep ? "approved" : "proses",
        parsed.applicationId,
      ],
    );

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
        "approved",
      );
      await notifyLandPermitApprovalMoved(
        client,
        notificationContext,
        user.id,
        isFinalStep
          ? null
          : NEXT_ROLE_BY_STEP[Number(context.step_order) + 1],
      );
    }

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: isFinalStep
        ? "Permohonan izin lahan telah disetujui final."
        : "Approval izin lahan berhasil diproses.",
      data: approval.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error approving land permit application",
      error,
      "Terjadi kesalahan saat memproses approval izin lahan.",
    );
  } finally {
    client.release();
  }
}
