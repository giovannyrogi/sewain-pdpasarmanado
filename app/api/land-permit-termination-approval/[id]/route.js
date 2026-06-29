import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import {
  lockTerminationApprovalContext,
  parseTerminationApprovalRequest,
  validateTerminationApprovalTurn,
} from "../approvalHelpers";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    const parsed = await parseTerminationApprovalRequest(request, params);
    if (parsed.response) return parsed.response;

    if (parsed.body?.status !== "approved") {
      return failResponse("Status approval tidak valid.", 400);
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

    const maxStepResult = await client.query(
      `
      SELECT MAX(step_order)::int AS max_step
      FROM land_permit_termination_approval
      WHERE land_permit_termination_id = $1
      `,
      [parsed.terminationId],
    );
    const maxStep = maxStepResult.rows[0]?.max_step || 5;
    const isFinalStep = Number(context.step_order) === Number(maxStep);

    const approval = await client.query(
      `
      UPDATE land_permit_termination_approval
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

    if (isFinalStep) {
      await client.query(
        `
        UPDATE land_permit_terminations
        SET current_step = $1,
            approval_status = 'approved',
            is_terminated = TRUE,
            terminated_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        `,
        [context.step_order, parsed.terminationId],
      );

      await client.query(
        `
        UPDATE land_permit_applications
        SET permit_status = 'terminated',
            updated_at = NOW()
        WHERE id = $1
        `,
        [context.land_permit_application_id],
      );

      await client.query(
        `
        UPDATE land_stalls
        SET status = 'available',
            notes = NULL,
            updated_at = NOW()
        WHERE id = $1
        `,
        [context.stall_id],
      );

      await client.query(
        `
        UPDATE tenant_identities
        SET land_permit_status = 'blacklisted',
            land_permit_status_notes = $1,
            land_permit_status_updated_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        `,
        [
          `Data izin lahan telah dinonaktifkan. Alasan: ${context.reason}`,
          context.tenant_identity_id,
        ],
      );
    } else {
      await client.query(
        `
        UPDATE land_permit_terminations
        SET current_step = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [Number(context.step_order) + 1, parsed.terminationId],
      );
    }

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: isFinalStep
        ? "Pengajuan non-aktif izin lahan telah disetujui final. Lahan tersedia kembali dan status identitas izin lahan diperbarui."
        : "Approval non-aktif izin lahan berhasil diproses.",
      data: approval.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error approving land permit termination",
      error,
      "Terjadi kesalahan saat memproses approval non-aktif izin lahan.",
    );
  } finally {
    client.release();
  }
}
