import pool from "@/lib/dbConfig";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id tenant_approval dari URL
    const body = await request.json();
    const { notes, status, approver_id, tenant_application_id } = body;

    if (!notes) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Alasan penolakan wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Ambil data tenant_approval yang akan diupdate
    const approvalRes = await pool.query(
      `SELECT * FROM tenant_approval WHERE id=$1`,
      [id]
    );
    if (approvalRes.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data tenant approval tidak ditemukan",
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

    // Validasi step untuk reject
    if (stepOrder > currentStep) {
      // Ambil divisi sebelumnya
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
          message: `Masih menunggu approval dari ${prevRoleName}, tidak bisa menolak`,
        }),
        { status: 200 }
      );
    }

    // Lakukan update tenant_approval untuk reject
    const result = await pool.query(
      `UPDATE tenant_approval 
       SET status=$1, notes=$2, approver_id=$3, approved_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, notes, approver_id, id]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Penolakan sewa ruangan berhasil diproses",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error update tenant_approval:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Terjadi kesalahan server",
      }),
      { status: 500 }
    );
  }
}
