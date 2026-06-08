import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

const NON_FINANCE_ROLES = [1, 2, 3, 4, 5, 6, 7];

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const roleId = user.role_id;

    if (!NON_FINANCE_ROLES.includes(Number(roleId))) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Anda tidak memiliki akses ke approval terminasi.",
        }),
        { status: 403 }
      );
    }

    if (!roleId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter role_id wajib diisi",
        }),
        { status: 400 }
      );
    }

    const result = await pool.query(
    `
    SELECT
      -- ID Approval
      tta.id AS termination_approval_id,
      tta.tenant_early_termination_id,

      -- Data tenant early termination
      tet.reason,
      tet.statement_file_path,
      tet.processed_by AS termination_processed_by,
      u2.full_name AS termination_processed_by_full_name,
      tet.terminated_at,
      tet.current_step AS termination_current_step,
      tet.approval_status AS termination_approval_status,
      tet.is_terminated,
      tet.created_at AS termination_created_at,

      -- Data approval lainnya
      tta.role_id,
      tta.approver_id,
      tta.step_order,
      tta.status,
      tta.notes,
      tta.approved_at,
      r.role_name,
      u.id AS user_id,
      u.full_name AS approver_full_name,

      -- data identitas tenant dari tenant_identities
      ti.full_name AS tenant_name,
      ti.nik AS tenant_nik,
      ti.phone AS tenant_phone,
      ti.ktp_file_path,

      -- Data tenant application
      tapp.id AS tenant_application_id,
      tapp.start_date,
      tapp.end_date,
      tapp.payment_type,
      tapp.total_payment,
      tapp.total_payment_room,
      tapp.annual_room_rent,
      tapp.lease_duration_years,
      tapp.total_ppn,
      tapp.admin_fee,
      tapp.down_payment,
      tapp.remaining_payment,
      tapp.approval_status AS tenant_approval_status,
      tapp.current_step AS tenant_current_step,
      tapp.tenant_identity_id,

      -- Data lokasi & ruangan
      l.id AS location_id,
      l.location_name,
      rm.id AS room_id,
      rm.room_number,
      rm.floor_id,
      rm.room_length,
      rm.room_width,
      rm.room_area,
      rm.price_per_m2,
      lfp.floor
    FROM tenant_termination_approval tta
    JOIN roles r ON tta.role_id = r.id
    LEFT JOIN users u ON tta.approver_id = u.id
    JOIN tenant_early_terminations tet 
      ON tta.tenant_early_termination_id = tet.id
    LEFT JOIN users u2 ON tet.processed_by = u2.id
    JOIN tenant_application tapp ON tet.tenant_application_id = tapp.id
    JOIN tenant_identities ti ON tapp.tenant_identity_id = ti.id
    JOIN rooms rm ON tapp.room_id = rm.id
    JOIN locations l ON tapp.location_id = l.id
    LEFT JOIN location_floor_prices lfp ON rm.floor_id = lfp.id
    WHERE tta.role_id = $1
    ORDER BY tta.created_at DESC
    `,
      [roleId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Berhasil mengambil data tenant termination approval berdasarkan role",
        data: result.rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant-termination-approval by role:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
