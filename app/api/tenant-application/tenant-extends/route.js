import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const today = moment().format("YYYY-MM-DD");

    const result = await pool.query(
      `
      SELECT 
        ta.id AS tenant_application_id,
        ta.tenant_identity_id,
        ta.start_date,
        ta.end_date,
        ta.approval_status,
        ti.full_name AS tenant_name
      FROM tenant_application ta
      LEFT JOIN tenant_identities ti 
        ON ta.tenant_identity_id = ti.id
      WHERE ta.approval_status = 'approved'
        AND ta.start_date IS NOT NULL
        AND ta.end_date IS NOT NULL
        AND ta.end_date <= $1
        AND is_fully_paid = true
        AND ti.status = 'active'
        -- hanya pilih tenant_application yang merupakan leaf (tidak punya renewal/child)
        AND NOT EXISTS (
          SELECT 1
          FROM tenant_application child
          WHERE child.renewal_of = ta.id
        )
      ORDER BY ta.end_date ASC
      `,
      [today]
    );

    const rows = result.rows.map((row) => ({
      tenant_application_id: row.tenant_application_id,
      tenant_identity_id: row.tenant_identity_id,
      start_date: row.start_date
        ? moment(row.start_date).format("YYYY-MM-DD")
        : null,
      end_date: row.end_date ? moment(row.end_date).format("YYYY-MM-DD") : null,
      approval_status: row.approval_status,
      tenant_name: row.tenant_name,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Berhasil mengambil data tenant application yang dapat diperpanjang",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error", err);

    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
