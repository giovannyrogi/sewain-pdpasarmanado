import pool from "@/lib/dbConfig";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id tenant_approval
    const body = await request.json();
    const { tenant_application_id, status, approver_id } = body;

    // Ambil data tenant_approval yang akan diupdate
    const approvalRes = await pool.query(
      `SELECT * FROM tenant_approval WHERE id=$1`,
      [id]
    );
    if (approvalRes.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Tenant Approval tidak ditemukan",
        }),
        { status: 404 }
      );
    }
    const approvalData = approvalRes.rows[0];
    const stepOrder = approvalData.step_order;

    // Ambil current_step dari tenant_application
    const tenantRes = await pool.query(
      `SELECT current_step FROM tenant_application WHERE id=$1`,
      [tenant_application_id]
    );
    const currentStep = tenantRes.rows[0]?.current_step || 1;

    // Validasi step approval
    if (stepOrder > currentStep) {
      // Ambil step sebelumnya
      const prevStepRes = await pool.query(
        `SELECT ta.step_order, r.role_name 
         FROM tenant_approval ta
         JOIN roles r ON ta.role_id = r.id
         WHERE ta.tenant_application_id=$1 AND ta.step_order=$2`,
        [tenant_application_id, currentStep]
      );
      const prevRoleName =
        prevStepRes.rows[0]?.role_name || "divisi sebelumnya";

      return new Response(
        JSON.stringify({
          success: false,
          message: `Masih menunggu approval dari ${prevRoleName}`,
        }),
        { status: 400 }
      );
    }

    // Update tenant_approval
    const updateApproval = await pool.query(
      `UPDATE tenant_approval 
       SET status=$1, approver_id=$2, approved_at=$3
       WHERE id=$4 RETURNING *`,
      [status, approver_id, new Date(), id]
    );

    // Update tenant_application.current_step jika step valid & approved
    if (status === "approved" && stepOrder === currentStep) {
      // Cari total step
      const totalStepsResult = await pool.query(
        `SELECT MAX(step_order) as max_step 
         FROM tenant_approval 
         WHERE tenant_application_id=$1`,
        [tenant_application_id]
      );
      const maxStep = totalStepsResult.rows[0]?.max_step || 1;

      if (stepOrder === maxStep) {
        // Step terakhir → set approval_status = approved
        await pool.query(
          `UPDATE tenant_application 
           SET current_step=$1, approval_status='approved'
           WHERE id=$2`,
          [stepOrder, tenant_application_id]
        );
      } else {
        // Step berikutnya
        await pool.query(
          `UPDATE tenant_application 
           SET current_step=$1
           WHERE id=$2`,
          [stepOrder + 1, tenant_application_id]
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval berhasil diproses",
        data: updateApproval.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error update Tenant Approval", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
