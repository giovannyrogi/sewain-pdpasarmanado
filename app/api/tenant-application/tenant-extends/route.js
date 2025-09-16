import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const today = moment().format("YYYY-MM-DD");
    const result = await pool.query(
      `SELECT * FROM tenant_application
        WHERE approval_status = 'approved'
        AND start_date IS NOT NULL
        AND end_date IS NOT NULL
        AND end_date <= $1`,
      [today]
    );

    // mapping sesuai kebutuhan
    const rows = result.rows.map((row) => ({
      id: row.id,
      start_date: moment(row.start_date).format("YYYY-MM-DD"),
      end_date: moment(row.end_date).format("YYYY-MM-DD"),
      approval_status: row.approval_status,
      tenant_name: row.tenant_name,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant application",
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
