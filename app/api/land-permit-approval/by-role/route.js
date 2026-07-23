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
import { LAND_PERMIT_APPROVAL_ROLES } from "../approvalHelpers";

export async function GET(request) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (response) return response;

    if (!LAND_PERMIT_APPROVAL_ROLES.includes(Number(user.role_id))) {
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
        "Anda tidak dapat mengakses approval izin lahan role lain.",
      );
    }

    const result = await pool.query(
      `
      SELECT
        approval.id,
        approval.land_permit_application_id,
        approval.role_id,
        approval.approver_id,
        approval.step_order,
        approval.status,
        approval.notes,
        approval.approved_at,
        approval.created_at AS approval_created_at,
        roles.role_name,
        approver.full_name AS approver_name,
        app.application_type,
        app.tenant_identity_id,
        app.commodity_type,
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
        app.permit_status,
        app.administration_type,
        app.admin_fee,
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
        location.location_name,
        sector.sector_name,
        sector.sector_code,
        stall.stall_number,
        stall.stall_length,
        stall.stall_width,
        stall.stall_area,
        stall.price_per_m2
      FROM land_permit_approval approval
      JOIN land_permit_applications app
        ON app.id = approval.land_permit_application_id
      JOIN roles ON roles.id = approval.role_id
      LEFT JOIN users approver ON approver.id = approval.approver_id
      JOIN tenant_identities identity ON identity.id = app.tenant_identity_id
      JOIN locations location ON location.id = app.location_id
      JOIN land_sectors sector ON sector.id = app.sector_id
      JOIN land_stalls stall ON stall.id = app.stall_id
      WHERE (
        ($1 = 1 AND approval.step_order = app.current_step)
        OR approval.role_id = $1
      )
      ORDER BY app.created_at DESC
      `,
      [roleId],
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil approval izin lahan.",
      data: result.rows,
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land permit approval by role",
      error,
      "Terjadi kesalahan saat mengambil approval izin lahan.",
    );
  }
}
