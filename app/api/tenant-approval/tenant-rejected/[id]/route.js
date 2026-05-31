import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getTenantNotificationContext,
  notifyTenantApprovalActionCompleted,
  notifyTenantApprovalRejected,
} from "@/app/utils/notifications";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { id } = await params; // id tenant_approval dari URL
    const body = await request.json();
    const { notes, status, tenant_application_id } = body;
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const approver_id = authUser.id;

    if (!notes) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Alasan penolakan wajib diisi",
        }),
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Ambil data tenant_approval yang akan diupdate
    const approvalRes = await client.query(
      `SELECT * FROM tenant_approval WHERE id=$1`,
      [id]
    );

    if (approvalRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data tenant approval tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const approvalData = approvalRes.rows[0];
    if (approvalData.role_id !== authUser.role_id) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Anda tidak memiliki akses untuk approval ini" },
        { status: 403 },
      );
    }

    const stepOrder = approvalData.step_order;

    // Ambil current_step dari tenant_application
    const tenantRes = await client.query(
      `SELECT current_step FROM tenant_application WHERE id=$1`,
      [tenant_application_id]
    );
    const currentStep = tenantRes.rows[0]?.current_step || 1;

    // Validasi step untuk reject
    if (stepOrder > currentStep) {
      const prevStepRes = await client.query(
        `SELECT ta.step_order, r.role_name 
         FROM tenant_approval ta
         JOIN roles r ON ta.role_id = r.id
         WHERE ta.tenant_application_id=$1 AND ta.step_order=$2`,
        [tenant_application_id, currentStep]
      );

      const prevRoleName =
        prevStepRes.rows[0]?.role_name || "divisi sebelumnya";

      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: `Masih menunggu approval dari ${prevRoleName}, tidak bisa menolak`,
        }),
        { status: 200 }
      );
    }

    // Update tenant_approval (penolakan)
    const updateApproval = await client.query(
      `UPDATE tenant_approval 
       SET status=$1, notes=$2, approver_id=$3, approved_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, notes, approver_id, id]
    );

    if (updateApproval.rowCount === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal mengupdate data tenant approval",
        }),
        { status: 500 }
      );
    }

    // Update tenant_application.approval_status menjadi 'rejected'
    const updateApplication = await client.query(
      `UPDATE tenant_application
       SET approval_status='rejected'
       WHERE id=$1 RETURNING *`,
      [tenant_application_id]
    );

    if (updateApplication.rowCount === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal memperbarui status tenant application",
        }),
        { status: 500 }
      );
    }

    const tenantContext = await getTenantNotificationContext(
      client,
      tenant_application_id,
    );

    // Notifikasi reject hanya dikirim ke pihak terkait agar inbox role lain
    // tidak penuh oleh informasi yang tidak perlu ditindaklanjuti.
    if (tenantContext) {
      await notifyTenantApprovalActionCompleted(
        client,
        tenantContext,
        approver_id,
        approvalData.role_id,
        status,
      );

      await notifyTenantApprovalRejected(
        client,
        tenantContext,
        approver_id,
        notes,
      );
    }

    await client.query("COMMIT");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Penolakan sewa ruangan berhasil diproses",
        data: {
          approval: updateApproval.rows[0],
          application: updateApplication.rows[0],
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error update tenant_approval:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan server",
      }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
