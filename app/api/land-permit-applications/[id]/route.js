import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";
import { calculateAnnualLandRent } from "@/app/utils/landPermitCalculations";
import { validateLandPermitApplicationPayload } from "../validation";
import {
  getLandPermitNotificationContext,
  notifyLandPermitResubmitted,
} from "@/app/utils/notifications";

const LAND_PERMIT_APPLICATION_ROLES = [1, 9];

const getApplicationId = async (params) => {
  const { id } = await params;
  return parsePositiveInteger(id, "ID permohonan");
};

const ensureIdentityEligible = async (client, identityId) => {
  const result = await client.query(
    `
    SELECT id
    FROM tenant_identities
    WHERE id = $1
      AND land_permit_status = 'active'
    LIMIT 1
    `,
    [identityId],
  );

  return result.rowCount > 0;
};

const getStallForApplication = async (client, values, applicationId) => {
  const result = await client.query(
    `
    SELECT
      lst.id,
      lst.status,
      lst.stall_length,
      lst.stall_width,
      lst.stall_area,
      lst.price_per_m2,
      ls.status AS sector_status
    FROM land_stalls lst
    JOIN land_sectors ls ON ls.id = lst.sector_id
    WHERE lst.id = $1
      AND lst.location_id = $2
      AND lst.sector_id = $3
    LIMIT 1
    `,
    [values.stall_id, values.location_id, values.sector_id],
  );

  if (result.rowCount === 0) {
    return {
      error: "Lahan tidak ditemukan pada lokasi dan sektor yang dipilih.",
    };
  }

  const stall = result.rows[0];
  if (stall.sector_status !== "active") {
    return { error: "Sektor yang dipilih tidak aktif." };
  }

  if (stall.status !== "available") {
    const sameApplication = await client.query(
      "SELECT 1 FROM land_permit_applications WHERE id = $1 AND stall_id = $2 LIMIT 1",
      [applicationId, values.stall_id],
    );

    if (sameApplication.rowCount === 0) {
      return { error: "Lahan yang dipilih tidak tersedia." };
    }
  }

  return { stall };
};

const releaseStallIfUnused = async (client, stallId) => {
  if (!stallId) return;

  const used = await client.query(
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

  if (used.rowCount === 0) {
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
  }
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_PERMIT_APPLICATION_ROLES);
    if (response) return response;

    const { value: applicationId, error: idError } =
      await getApplicationId(params);
    if (idError) return failResponse(idError, 400);

    const body = await request.json();
    const { values, error } = validateLandPermitApplicationPayload(body, {
      mode: "edit",
    });
    if (error) return failResponse(error, 400);

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT tenant_identity_id, stall_id, approval_status, current_step
      FROM land_permit_applications
      WHERE id = $1
      LIMIT 1
      `,
      [applicationId],
    );

    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return failResponse("Permohonan izin lahan tidak ditemukan.", 404);
    }

    if (existing.rows[0].approval_status === "approved") {
      await client.query("ROLLBACK");
      return failResponse(
        "Permohonan yang sudah disetujui tidak dapat diubah.",
        409,
      );
    }

    if (
      Number(existing.rows[0].tenant_identity_id) !==
      Number(values.tenant_identity_id)
    ) {
      await client.query("ROLLBACK");
      return failResponse(
        "Identitas pemohon tidak dapat diubah saat edit.",
        400,
      );
    }

    const eligible = await ensureIdentityEligible(
      client,
      values.tenant_identity_id,
    );
    if (!eligible) {
      await client.query("ROLLBACK");
      return failResponse("Identitas tidak aktif untuk izin lahan.", 400);
    }

    const { stall, error: stallError } = await getStallForApplication(
      client,
      values,
      applicationId,
    );
    if (stallError) {
      await client.query("ROLLBACK");
      return failResponse(stallError, 400);
    }

    const annualLandRent = calculateAnnualLandRent(stall);
    const administrationType =
      values.administration_type === "kip" ? 100000 : 150000; // Set admin fee based on administration type
    const admin_fee = administrationType * values.lease_duration_years; // dynamic admin fee based on administration type
    const totalPaymentLand = annualLandRent * values.lease_duration_years;
    const totalPayment = totalPaymentLand + admin_fee; // total payment including admin fee
    const wasRejected = existing.rows[0].approval_status === "rejected";

    let resumeStep = Number(existing.rows[0].current_step) || 1;
    if (wasRejected) {
      const rejectedStep = await client.query(
        `
        SELECT step_order
        FROM land_permit_approval
        WHERE land_permit_application_id = $1
          AND status = 'rejected'
        ORDER BY step_order ASC
        LIMIT 1
        `,
        [applicationId],
      );
      resumeStep = Number(rejectedStep.rows[0]?.step_order || resumeStep);
    }

    await client.query(
      `
      UPDATE land_permit_applications
      SET
        renewal_of = $1,
        application_type = $2,
        commodity_type = $3,
        location_id = $4,
        sector_id = $5,
        stall_id = $6,
        start_date = $7,
        end_date = $8,
        lease_duration_years = $9,
        annual_land_rent = $10,
        total_payment_land = $11,
        total_payment = $12,
        approval_status = CASE WHEN $13 THEN 'proses' ELSE approval_status END,
        current_step = CASE WHEN $13 THEN $14 ELSE current_step END,
        administration_type = $15,
        admin_fee = $16,
        updated_at = NOW()
      WHERE id = $17
      `,
      [
        values.renewal_of,
        values.application_type,
        values.commodity_type,
        values.location_id,
        values.sector_id,
        values.stall_id,
        values.start_date,
        values.end_date,
        values.lease_duration_years,
        annualLandRent,
        totalPaymentLand,
        totalPayment,
        wasRejected,
        resumeStep,
        values.administration_type,
        admin_fee,
        applicationId,
      ],
    );

    if (wasRejected) {
      await client.query(
        `
        UPDATE land_permit_approval
        SET status = 'pending',
            approver_id = NULL,
            approved_at = NULL,
            notes = NULL,
            updated_at = NOW()
        WHERE land_permit_application_id = $1
          AND step_order >= $2
        `,
        [applicationId, resumeStep],
      );
    }

    await client.query(
      "UPDATE land_stalls SET status = 'occupied', notes = $2 WHERE id = $1",
      [
        values.stall_id,
        `Lahan sedang diproses untuk permohonan izin lahan mulai ${values.start_date} s/d ${values.end_date}.`,
      ],
    );

    if (Number(existing.rows[0].stall_id) !== Number(values.stall_id)) {
      await releaseStallIfUnused(client, existing.rows[0].stall_id);
    }

    if (wasRejected) {
      const notificationContext = await getLandPermitNotificationContext(
        client,
        applicationId,
      );
      if (notificationContext) {
        await notifyLandPermitResubmitted(
          client,
          notificationContext,
          resumeStep,
        );
      }
    }

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: "Permohonan izin lahan berhasil diperbarui.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error updating land permit application",
      error,
      "Terjadi kesalahan saat memperbarui permohonan izin lahan.",
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_PERMIT_APPLICATION_ROLES);
    if (response) return response;

    const { value: applicationId, error } = await getApplicationId(params);
    if (error) return failResponse(error, 400);

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT stall_id, approval_status FROM land_permit_applications WHERE id = $1 LIMIT 1",
      [applicationId],
    );

    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return failResponse("Permohonan izin lahan tidak ditemukan.", 404);
    }

    if (existing.rows[0].approval_status === "approved") {
      await client.query("ROLLBACK");
      return failResponse(
        "Permohonan yang sudah disetujui tidak dapat dihapus.",
        409,
      );
    }

    await client.query(
      "DELETE FROM land_permit_approval WHERE land_permit_application_id = $1",
      [applicationId],
    );
    await client.query("DELETE FROM land_permit_applications WHERE id = $1", [
      applicationId,
    ]);
    await releaseStallIfUnused(client, existing.rows[0].stall_id);

    await client.query("COMMIT");

    return jsonResponse({
      success: true,
      message: "Permohonan izin lahan berhasil dihapus.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return handleApiError(
      "Error deleting land permit application",
      error,
      "Terjadi kesalahan saat menghapus permohonan izin lahan.",
    );
  } finally {
    client.release();
  }
}
