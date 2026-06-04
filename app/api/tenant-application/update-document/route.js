import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";

const CONTRACT_DOCUMENT_ROLES = [1, 2];

export async function GET() {
  try {
    const { response } = await requireRole(CONTRACT_DOCUMENT_ROLES);
    if (response) return response;

    const sql = `
      SELECT 
        ta.document_number,
        regexp_replace(ta.document_number, '^([0-9]+).*$', '\\1') AS highest_document_number_str,
        CAST(NULLIF(regexp_replace(ta.document_number, '^([0-9]+).*$', '\\1'), '') AS INT) AS highest_document_number_int
      FROM tenant_application ta
      WHERE ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
        AND ta.document_number IS NOT NULL
      ORDER BY highest_document_number_int DESC
      LIMIT 1
    `;

    const result = await pool.query(sql);
    const latest = result.rows[0] || null;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil document_number tertinggi",
        data: latest
          ? {
              document_number: latest.document_number,
              highest_document_number: latest.highest_document_number_str, // tetap "002"
              highest_document_number_int: latest.highest_document_number_int, // juga kirim int kalau butuh
            }
          : null,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
