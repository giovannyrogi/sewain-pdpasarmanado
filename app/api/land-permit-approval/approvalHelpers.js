import {
  failResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";

export const LAND_PERMIT_APPROVAL_ROLES = [1, 3, 4, 5, 6, 7];

export const parseApprovalRequest = async (request, params) => {
  const { id } = await params;
  const approvalId = parsePositiveInteger(id, "ID approval");
  if (approvalId.error) {
    return { response: failResponse(approvalId.error, 400) };
  }

  const body = await request.json();
  const applicationId = parsePositiveInteger(
    body?.land_permit_application_id,
    "ID permohonan izin lahan",
  );
  if (applicationId.error) {
    return { response: failResponse(applicationId.error, 400) };
  }

  return {
    approvalId: approvalId.value,
    applicationId: applicationId.value,
    body,
    response: null,
  };
};

export const lockApprovalContext = async (
  client,
  approvalId,
  applicationId,
) => {
  const result = await client.query(
    `
    SELECT
      lpa.id,
      lpa.land_permit_application_id,
      lpa.role_id,
      lpa.step_order,
      lpa.status,
      app.current_step,
      app.approval_status,
      app.stall_id
    FROM land_permit_approval lpa
    JOIN land_permit_applications app
      ON app.id = lpa.land_permit_application_id
    WHERE lpa.id = $1
      AND lpa.land_permit_application_id = $2
    FOR UPDATE OF lpa, app
    `,
    [approvalId, applicationId],
  );

  return result.rows[0] || null;
};

export const validateApprovalTurn = async (client, context, user) => {
  if (!context) {
    return "Data approval izin lahan tidak ditemukan.";
  }

  if (Number(context.role_id) !== Number(user.role_id)) {
    return "Anda tidak memiliki akses untuk memproses approval ini.";
  }

  if (context.approval_status !== "proses") {
    return "Permohonan ini sudah memiliki status final.";
  }

  if (context.status !== "pending") {
    return "Tahap approval ini sudah diproses.";
  }

  if (Number(context.step_order) !== Number(context.current_step)) {
    return "Permohonan belum masuk ke giliran approval Anda.";
  }

  if (Number(context.step_order) > 1) {
    const previous = await client.query(
      `
      SELECT status
      FROM land_permit_approval
      WHERE land_permit_application_id = $1
        AND step_order = $2
      LIMIT 1
      `,
      [context.land_permit_application_id, Number(context.step_order) - 1],
    );

    if (previous.rows[0]?.status !== "approved") {
      return "Tahap approval sebelumnya belum disetujui.";
    }
  }

  return null;
};

export const releaseLandStall = async (client, stallId) => {
  const activeUsage = await client.query(
    `
    SELECT 1
    FROM land_permit_applications
    WHERE stall_id = $1
      AND approval_status IN ('proses', 'approved')
      AND permit_status <> 'terminated'
    LIMIT 1
    `,
    [stallId],
  );

  if (activeUsage.rowCount > 0) return;

  await client.query(
    `
    UPDATE land_stalls
    SET status = 'available',
        notes = NULL,
        updated_at = NOW()
    WHERE id = $1
    `,
    [stallId],
  );
};
