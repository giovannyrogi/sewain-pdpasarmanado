import pool from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("role_id");

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

        -- lokasi & ruangan
        l.location_name,
        rm.room_number,
        rm.floor_id,
        rm.room_length,
        rm.room_width,
        rm.room_area,
        rm.price_per_m2,
        lfp.floor
      FROM tenant_approval ta
      JOIN roles r ON ta.role_id = r.id
      LEFT JOIN users u ON ta.approver_id = u.id
      JOIN tenant_application tapp ON ta.tenant_application_id = tapp.id
      JOIN tenant_identities ti ON tapp.tenant_identity_id = ti.id
      JOIN rooms rm ON tapp.room_id = rm.id
      JOIN locations l ON tapp.location_id = l.id
      LEFT JOIN location_floor_prices lfp ON rm.floor_id = lfp.id
      WHERE ta.role_id = $1
      ORDER BY ta.created_at DESC
      `,
      [roleId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant approval berdasarkan role",
        data: result.rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant-approval by role:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
