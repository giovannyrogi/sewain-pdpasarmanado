import pool from "@/lib/dbConfig";

export async function PUT(request, { params }) {
  const client = await pool.connect();
  try {
    const { id } = params; // id tenant_termination_approval
    const body = await request.json();
    const { tenant_early_termination_id, status, approver_id, room_id } = body;

    // --- Ambil data approval yang akan diupdate ---
    const approvalRes = await client.query(
      `SELECT * FROM tenant_termination_approval WHERE id=$1`,
      [id]
    );
    if (approvalRes.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Approval tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const approvalData = approvalRes.rows[0];
    const stepOrder = approvalData.step_order;

    // --- Ambil current_step dari tenant_early_terminations ---
    const terminationRes = await client.query(
      `SELECT current_step, approval_status FROM tenant_early_terminations WHERE id=$1`,
      [tenant_early_termination_id]
    );
    if (terminationRes.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Tenant Early Termination tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const currentStep = terminationRes.rows[0].current_step;

    // --- Validasi step approval ---
    if (stepOrder > currentStep) {
      // Cari siapa yang belum approve
      const prevStepRes = await client.query(
        `SELECT tta.step_order, r.role_name 
         FROM tenant_termination_approval tta
         JOIN roles r ON tta.role_id = r.id
         WHERE tta.tenant_early_termination_id=$1 AND tta.step_order=$2`,
        [tenant_early_termination_id, currentStep]
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

    await client.query("BEGIN");

    // --- Update tenant_termination_approval untuk step ini ---
    const updateApproval = await client.query(
      `UPDATE tenant_termination_approval 
       SET status=$1, approver_id=$2, approved_at=$3
       WHERE id=$4 AND tenant_early_termination_id=$5
       RETURNING *`,
      [status, approver_id, new Date(), id, tenant_early_termination_id]
    );

    // --- Hitung max_step ---
    const totalStepsResult = await client.query(
      `SELECT MAX(step_order) as max_step 
       FROM tenant_termination_approval 
       WHERE tenant_early_termination_id=$1`,
      [tenant_early_termination_id]
    );
    const maxStep = totalStepsResult.rows[0]?.max_step || 1;

    // --- Update current_step & status pada tenant_early_terminations ---
    if (status === "approved" && stepOrder === currentStep) {
      if (stepOrder === maxStep) {
        // Step terakhir → approved semua
        await client.query(
          `UPDATE tenant_early_terminations 
           SET current_step=$1,
               approval_status='approved',
               is_terminated=true,
               updated_at=$3
           WHERE id=$2`,
          [stepOrder, tenant_early_termination_id, new Date()]
        );

        // update rooms.is_available=false (ruangan sekarang kosong)
        if (room_id) {
          await client.query(
            `UPDATE rooms SET is_available=false WHERE id=$1`,
            [room_id]
          );
        }
      } else {
        // Step berikutnya
        await client.query(
          `UPDATE tenant_early_terminations 
           SET current_step=$1, updated_at=$3
           WHERE id=$2`,
          [stepOrder + 1, tenant_early_termination_id, new Date()]
        );
      }
    } else if (status === "rejected") {
      // Jika di-reject
      await client.query(
        `UPDATE tenant_early_terminations 
         SET approval_status='rejected', updated_at=$2
         WHERE id=$1`,
        [tenant_early_termination_id, new Date()]
      );
    }

    await client.query("COMMIT");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval berhasil diproses",
        data: updateApproval.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error update Tenant Termination Approval", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
