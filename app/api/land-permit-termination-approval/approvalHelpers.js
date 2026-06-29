import {
  failResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

export const LAND_PERMIT_TERMINATION_APPROVAL_ROLES = [1, 3, 4, 5, 6, 7];

/**
 * Membaca dan memvalidasi request approve/reject terminasi izin lahan.
 * Approval ID datang dari URL, sedangkan ID terminasi wajib dikirim dari body
 * supaya endpoint tidak bisa memproses approval yang tidak cocok dengan entitasnya.
 */
export const parseTerminationApprovalRequest = async (request, params) => {
  const { id } = await params;
  const approvalId = parsePositiveInteger(id, "ID approval non-aktif izin lahan");
  if (approvalId.error) {
    return { response: failResponse(approvalId.error, 400) };
  }

  const body = await request.json();
  const terminationId = parsePositiveInteger(
    body?.land_permit_termination_id,
    "ID non-aktif izin lahan",
  );
  if (terminationId.error) {
    return { response: failResponse(terminationId.error, 400) };
  }

  return {
    approvalId: approvalId.value,
    terminationId: terminationId.value,
    body,
    response: null,
  };
};

/**
 * Mengunci row approval, terminasi, dan permohonan agar satu approval tidak
 * bisa diproses bersamaan oleh request berbeda.
 */
export const lockTerminationApprovalContext = async (
  client,
  approvalId,
  terminationId,
) => {
  const result = await client.query(
    `
    SELECT
      approval.id,
      approval.land_permit_termination_id,
      approval.role_id,
      approval.step_order,
      approval.status,
      termination.current_step,
      termination.approval_status,
      termination.reason,
      termination.land_permit_application_id,
      app.stall_id,
      app.tenant_identity_id
    FROM land_permit_termination_approval approval
    JOIN land_permit_terminations termination
      ON termination.id = approval.land_permit_termination_id
    JOIN land_permit_applications app
      ON app.id = termination.land_permit_application_id
    WHERE approval.id = $1
      AND approval.land_permit_termination_id = $2
    FOR UPDATE OF approval, termination, app
    `,
    [approvalId, terminationId],
  );

  return result.rows[0] || null;
};

/**
 * Menjaga approval tetap sesuai giliran role dan urutan step. Superadmin hanya
 * dapat melihat data; pemrosesan approval tetap harus dilakukan oleh role step.
 */
export const validateTerminationApprovalTurn = async (client, context, user) => {
  if (!context) {
    return "Data approval non-aktif izin lahan tidak ditemukan.";
  }

  if (Number(context.role_id) !== Number(user.role_id)) {
    return "Anda tidak memiliki akses untuk memproses approval ini.";
  }

  if (context.approval_status !== "proses") {
    return "Pengajuan non-aktif izin lahan sudah memiliki status final.";
  }

  if (context.status !== "pending") {
    return "Tahap approval ini sudah diproses.";
  }

  if (Number(context.step_order) !== Number(context.current_step)) {
    return "Pengajuan non-aktif izin lahan belum masuk ke giliran Anda.";
  }

  if (Number(context.step_order) > 1) {
    const previous = await client.query(
      `
      SELECT status
      FROM land_permit_termination_approval
      WHERE land_permit_termination_id = $1
        AND step_order = $2
      LIMIT 1
      `,
      [
        context.land_permit_termination_id,
        Number(context.step_order) - 1,
      ],
    );

    if (previous.rows[0]?.status !== "approved") {
      return "Tahap approval sebelumnya belum disetujui.";
    }
  }

  return null;
};
