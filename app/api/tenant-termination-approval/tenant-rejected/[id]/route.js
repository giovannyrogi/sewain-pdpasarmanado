import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getTerminationNotificationContext,
  notifyTerminationApprovalActionCompleted,
  notifyTerminationRejected,
} from "@/app/utils/notifications";

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { id } = await params; // id tenant_termination_approval dari URL
    const body = await request.json();
    const { notes, status, tenant_early_termination_id } = body;
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return unauthorizedResponse();
    }

    const approver_id = authUser.id;

    if (!notes) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Alasan Non-aktif wajib diisi",
        }),
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Ambil data tenant_termination_approval yang akan diupdate
    const approvalRes = await client.query(
      `SELECT * FROM tenant_termination_approval WHERE id=$1`,
      [id]
    );

    if (approvalRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data termination approval tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const approvalData = approvalRes.rows[0];
    const stepOrder = approvalData.step_order;

    if (Number(approvalData.tenant_early_termination_id) !== Number(tenant_early_termination_id)) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data approval tidak sesuai dengan permintaan terminasi.",
        }),
        { status: 400 }
      );
    }

    if (Number(approvalData.role_id) !== Number(authUser.role_id)) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Role Anda tidak sesuai dengan step approval ini.",
        }),
        { status: 403 }
      );
    }

    // Ambil current_step dari tenant_early_terminations
    const tenantRes = await client.query(
      `SELECT current_step FROM tenant_early_terminations WHERE id=$1`,
      [tenant_early_termination_id]
    );
    const currentStep = tenantRes.rows[0]?.current_step || 1;

    // Validasi step untuk reject
    if (stepOrder > currentStep) {
      const prevStepRes = await client.query(
        `SELECT tta.step_order, r.role_name 
         FROM tenant_termination_approval tta
         JOIN roles r ON tta.role_id = r.id
         WHERE tta.tenant_early_termination_id=$1 AND tta.step_order=$2`,
        [tenant_early_termination_id, currentStep]
      );

      const prevRoleName =
        prevStepRes.rows[0]?.role_name || "divisi sebelumnya";

      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: `Masih menunggu approval dari ${prevRoleName}, tidak bisa menolak permintaan`,
        }),
        { status: 200 }
      );
    }

    // Update tenant_termination_approval
    const updateApproval = await client.query(
      `UPDATE tenant_termination_approval 
       SET status=$1, notes=$2, approver_id=$3, approved_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, notes, approver_id, id]
    );

    if (updateApproval.rowCount === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal mengupdate data termination approval",
        }),
        { status: 500 }
      );
    }

    // Update juga tenant_early_terminations.approval_status ke 'rejected'
    const updateEarlyTermination = await client.query(
      `UPDATE tenant_early_terminations 
       SET approval_status='rejected'
       WHERE id=$1 RETURNING *`,
      [tenant_early_termination_id]
    );

    if (updateEarlyTermination.rowCount === 0) {
      await client.query("ROLLBACK");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Gagal memperbarui status tenant_early_terminations",
        }),
        { status: 500 }
      );
    }

    const notificationContext = await getTerminationNotificationContext(
      client,
      tenant_early_termination_id,
    );

    if (notificationContext) {
      await notifyTerminationApprovalActionCompleted(
        client,
        notificationContext,
        approver_id,
        authUser.role_id,
        status,
      );
      await notifyTerminationRejected(
        client,
        notificationContext,
        approver_id,
        notes,
      );
    }

    await client.query("COMMIT");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menolak permintaan Non-Aktif",
        data: {
          approval: updateApproval.rows[0],
          early_termination: updateEarlyTermination.rows[0],
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error update tenant_termination_approval:", error);
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
