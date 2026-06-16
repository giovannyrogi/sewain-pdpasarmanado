import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

const NON_FINANCE_ROLES = [1, 2, 3, 4, 5, 6, 7];

export async function GET(req) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (!NON_FINANCE_ROLES.includes(Number(user.role_id))) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Anda tidak memiliki akses ke detail approval permohonan.",
        }),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantApplicationId = searchParams.get("tenant_application_id");

    if (!tenantApplicationId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter tenant_application_id wajib diisi",
        }),
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        ta.id,
        ta.tenant_application_id,
        ta.role_id,
        ta.approver_id,
        ta.step_order,
        ta.status,
        ta.notes,
        ta.approved_at,
        r.role_name,
        u.id AS user_id,
        u.full_name AS user_full_name,

        -- data identitas tenant dari tenant_identities
        ti.full_name AS tenant_name,
        ti.nik AS tenant_nik,
        ti.phone AS tenant_phone,
        ti.ktp_file_path,

        -- data kontrak/application
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
        tapp.approval_status,
        tapp.created_at,
        tapp.updated_at,
        tapp.current_step,
        tapp.estimated_installment_1,
        tapp.estimated_installment_2,
        tapp.estimated_installment_3,
        tapp.estimated_installment_1_date,
        tapp.estimated_installment_2_date,
        tapp.estimated_installment_3_date,
        tapp.document_number,
        tapp.current_tenor,
        latest_contract.contract_number,
        latest_contract.contract_date,
        l.location_name,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,
        rm.price_type,
        lfp.floor
      FROM tenant_approval ta
      JOIN roles r ON ta.role_id = r.id
      LEFT JOIN users u ON ta.approver_id = u.id
      JOIN tenant_application tapp ON ta.tenant_application_id = tapp.id
      LEFT JOIN LATERAL (
        SELECT c.contract_number, c.contract_date
        FROM contracts c
        WHERE c.tenant_application_id = tapp.id
        ORDER BY c.created_at DESC
        LIMIT 1
      ) latest_contract ON TRUE
      JOIN tenant_identities ti ON tapp.tenant_identity_id = ti.id
      JOIN rooms rm ON tapp.room_id = rm.id
      JOIN locations l ON tapp.location_id = l.id
      LEFT JOIN location_floor_prices lfp ON rm.floor_id = lfp.id
      WHERE ta.tenant_application_id = $1
      ORDER BY ta.created_at DESC
      `,
      [tenantApplicationId] // pakai tenant_application_id
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Berhasil mengambil data tenant approval berdasarkan tenant_application_id",
        data: result.rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant-approval by tenant_application_id:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
