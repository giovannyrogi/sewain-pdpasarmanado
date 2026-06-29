import pool from "@/lib/dbConfig";
import {
  forbiddenResponse,
  requireAuthenticatedUser,
} from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";
import { LAND_PERMIT_TERMINATION_APPROVAL_ROLES } from "../approvalHelpers";

export async function GET(request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    if (!LAND_PERMIT_TERMINATION_APPROVAL_ROLES.includes(Number(user.role_id))) {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const roleIdResult = parsePositiveInteger(
      searchParams.get("role_id"),
      "Role approval",
    );
    if (roleIdResult.error) {
      return failResponse(roleIdResult.error, 400);
    }

    const roleId = roleIdResult.value;
    if (roleId !== Number(user.role_id) && Number(user.role_id) !== 1) {
      return forbiddenResponse(
        "Anda tidak dapat mengakses approval non-aktif izin lahan role lain.",
      );
    }

    const result = await pool.query(
      `
      SELECT
        approval.id,
        approval.id AS land_permit_termination_approval_id,
        approval.land_permit_termination_id,
        approval.role_id,
        approval.approver_id,
        approval.step_order,
        approval.status,
        approval.notes,
        approval.approved_at,
        approval.created_at AS approval_created_at,
        role.role_name,
        approver.full_name AS approver_name,
        termination.land_permit_application_id,
        termination.reason AS termination_reason,
        termination.reason,
        termination.statement_file_path,
        termination.processed_by AS termination_processed_by,
        processor.full_name AS termination_processed_by_full_name,
        termination.current_step AS termination_current_step,
        termination.approval_status AS termination_approval_status,
        termination.is_terminated,
        termination.created_at AS termination_created_at,
        app.application_type,
        app.tenant_identity_id,
        app.commodity_type,
        app.document_number,
        app.location_id,
        app.sector_id,
        app.stall_id,
        app.start_date,
        app.end_date,
        app.lease_duration_years,
        app.annual_land_rent,
        app.total_payment_land,
        app.total_payment,
        app.approval_status,
        app.current_step,
        app.payment_status,
        app.is_fully_paid,
        app.permit_status,
        app.created_at,
        app.updated_at,
        identity.full_name AS tenant_name,
        identity.nik AS tenant_nik,
        identity.phone AS tenant_phone,
        identity.ktp_file_path,
        identity.profile_photo_file_path,
        identity.birth_place,
        identity.birth_date,
        identity.nationality,
        identity.religion,
        identity.occupation,
        identity.street_address,
        identity.rt,
        identity.rw,
        identity.kelurahan,
        identity.district,
        identity.city,
        identity.province,
        identity.postal_code,
        identity.land_permit_status,
        identity.land_permit_status_notes,
        identity.status AS identity_status,
        location.location_name,
        location.location_code,
        sector.sector_name,
        sector.sector_code,
        stall.stall_number,
        stall.stall_length,
        stall.stall_width,
        stall.stall_area,
        stall.price_per_m2,
        document.document_number AS permit_document_number
      FROM land_permit_termination_approval approval
      JOIN land_permit_terminations termination
        ON termination.id = approval.land_permit_termination_id
      JOIN land_permit_applications app
        ON app.id = termination.land_permit_application_id
      JOIN roles role ON role.id = approval.role_id
      LEFT JOIN users approver ON approver.id = approval.approver_id
      LEFT JOIN users processor ON processor.id = termination.processed_by
      JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
      JOIN locations location ON location.id = app.location_id
      JOIN land_sectors sector ON sector.id = app.sector_id
      JOIN land_stalls stall ON stall.id = app.stall_id
      LEFT JOIN LATERAL (
        SELECT doc.document_number
        FROM land_permit_documents doc
        WHERE doc.land_permit_application_id = app.id
          AND doc.document_type = 'permit_document'
          AND doc.status <> 'void'
        ORDER BY doc.created_at DESC
        LIMIT 1
      ) document ON TRUE
      WHERE (
        ($1 = 1 AND approval.step_order = termination.current_step)
        OR approval.role_id = $1
      )
      ORDER BY termination.created_at DESC, approval.step_order ASC
      `,
      [roleId],
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil approval non-aktif izin lahan.",
      data: result.rows,
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land permit termination approval by role",
      error,
      "Terjadi kesalahan saat mengambil approval non-aktif izin lahan.",
    );
  }
}
