import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET() {
  try {
    // === Ambil data ACTIVE & EXPIRED dari tenant_application ===
    const tenantQuery = `
      SELECT id, start_date, end_date
      FROM tenant_application
      WHERE 
        approval_status = 'approved'
        AND start_date IS NOT NULL
        AND end_date IS NOT NULL
        AND document_number IS NOT NULL;
    `;

    // === Ambil data NON ACTIVE dari tenant_early_terminations ===
    const terminationQuery = `
      SELECT tenant_application_id
      FROM tenant_early_terminations
      WHERE 
        approval_status = 'approved'
        AND is_terminated = true;
    `;

    const [tenantResult, terminationResult] = await Promise.all([
      pool.query(tenantQuery),
      pool.query(terminationQuery),
    ]);

    const today = moment().startOf("day");

    // Buat daftar ID tenant yang sudah dinonaktifkan
    const terminatedIds = terminationResult.rows.map(
      (row) => row.tenant_application_id
    );

    // Hitung jumlah ACTIVE & EXPIRED (exclude yang sudah terminated)
    let activeCount = 0;
    let expiredCount = 0;

    tenantResult.rows.forEach((row) => {
      // Jika sudah nonaktif, skip
      if (terminatedIds.includes(row.id)) return;

      const endDate = moment(row.end_date);
      if (endDate.isBefore(today)) {
        expiredCount++;
      } else {
        activeCount++;
      }
    });

    // === Hitung jumlah NON ACTIVE ===
    const nonActiveCount = terminatedIds.length;

    // === Susun response ===
    const responseData = {
      active: activeCount,
      expired: expiredCount,
      non_active: nonActiveCount,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil status kontrak tenant",
        data: responseData,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching contract status:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
