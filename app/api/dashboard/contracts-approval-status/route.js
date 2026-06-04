import pool from "@/lib/dbConfig";
import { getAuthenticatedUser, unauthorizedResponse } from "@/app/utils/auth";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse();
    }

    // Query hitung total berdasarkan status approval
    const query = `
      SELECT 
        approval_status, 
        COUNT(*) AS total
      FROM tenant_application
      WHERE approval_status IN ('approved', 'proses', 'rejected')
      GROUP BY approval_status;
    `;

    const result = await pool.query(query);

    // Inisialisasi default agar tetap ada meski tidak ditemukan
    let approvedCount = 0;
    let processCount = 0;
    let rejectedCount = 0;

    result.rows.forEach((row) => {
      const status = row.approval_status?.toLowerCase();
      const count = parseInt(row.total, 10);

      if (status === "approved") approvedCount = count;
      else if (status === "proses") processCount = count;
      else if (status === "rejected") rejectedCount = count;
    });

    const responseData = {
      approved: approvedCount,
      process: processCount,
      rejected: rejectedCount,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil status approval kontrak",
        data: responseData,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching approval status:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
