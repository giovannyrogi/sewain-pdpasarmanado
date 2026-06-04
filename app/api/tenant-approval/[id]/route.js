import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";
import {
  getTenantNotificationContext,
  notifyTenantApprovalActionCompleted,
  notifyTenantApprovalMoved,
} from "@/app/utils/notifications";

const NEXT_APPROVAL_ROLE_BY_STEP = {
  2: 4,
  3: 5,
  4: 6,
  5: 7,
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { id } = await params;
    const body = await request.json();
    const { tenant_application_id, status } = body;
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return unauthorizedResponse();
    }
    const approver_id = authUser.id;

    await client.query("BEGIN");

    const approvalRes = await client.query(
      `SELECT * FROM tenant_approval WHERE id=$1`,
      [id],
    );

    if (approvalRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data Tenant Approval tidak ditemukan" },
        { status: 404 },
      );
    }

    const approvalData = approvalRes.rows[0];
    if (Number(approvalData.tenant_application_id) !== Number(tenant_application_id)) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Data approval tidak sesuai dengan permohonan" },
        { status: 400 },
      );
    }

    if (approvalData.role_id !== authUser.role_id) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Anda tidak memiliki akses untuk approval ini" },
        { status: 403 },
      );
    }

    const stepOrder = approvalData.step_order;

    const tenantRes = await client.query(
      `SELECT current_step FROM tenant_application WHERE id=$1`,
      [tenant_application_id],
    );
    const currentStep = tenantRes.rows[0]?.current_step || 1;

    if (stepOrder > currentStep) {
      const prevStepRes = await client.query(
        `
        SELECT ta.step_order, r.role_name
        FROM tenant_approval ta
        JOIN roles r ON ta.role_id = r.id
        WHERE ta.tenant_application_id=$1 AND ta.step_order=$2
        `,
        [tenant_application_id, currentStep],
      );
      const prevRoleName =
        prevStepRes.rows[0]?.role_name || "divisi sebelumnya";

      await client.query("ROLLBACK");
      return Response.json(
        {
          success: false,
          message: `Masih menunggu approval dari ${prevRoleName}`,
        },
        { status: 400 },
      );
    }

    const updateApproval = await client.query(
      `
      UPDATE tenant_approval
      SET status=$1, approver_id=$2, approved_at=$3
      WHERE id=$4 AND tenant_application_id=$5
      RETURNING *
      `,
      [status, approver_id, new Date(), id, tenant_application_id],
    );

    if (updateApproval.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json(
        { success: false, message: "Approval gagal diperbarui" },
        { status: 400 },
      );
    }

    const totalStepsResult = await client.query(
      `
      SELECT MAX(step_order) as max_step
      FROM tenant_approval
      WHERE tenant_application_id=$1
      `,
      [tenant_application_id],
    );
    const maxStep = totalStepsResult.rows[0]?.max_step || 1;

    if (status === "approved" && stepOrder === currentStep) {
      if (stepOrder === maxStep) {
        await client.query(
          `
          UPDATE tenant_application
          SET current_step=$1, approval_status='approved', updated_at=$3
          WHERE id=$2
          `,
          [stepOrder, tenant_application_id, new Date()],
        );
      } else {
        await client.query(
          `
          UPDATE tenant_application
          SET current_step=$1, updated_at=$3
          WHERE id=$2
          `,
          [stepOrder + 1, tenant_application_id, new Date()],
        );
      }

      const tenantContext = await getTenantNotificationContext(
        client,
        tenant_application_id,
      );

      /**
       * Jika masih ada step berikutnya, role tersebut mendapat notifikasi
       * "menunggu approval". Jika step terakhir selesai, semua role non-keuangan
       * mendapat notifikasi final approved.
       */
      if (tenantContext) {
        await notifyTenantApprovalActionCompleted(
          client,
          tenantContext,
          approver_id,
          approvalData.role_id,
          status,
        );

        await notifyTenantApprovalMoved(
          client,
          tenantContext,
          approver_id,
          stepOrder === maxStep
            ? null
            : NEXT_APPROVAL_ROLE_BY_STEP[Number(stepOrder) + 1],
        );
      }
    }

    await client.query("COMMIT");

    return Response.json({
      success: true,
      message: "Approval berhasil diproses",
      data: updateApproval.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error update Tenant Approval", err);
    return Response.json(
      { success: false, message: err.message },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
