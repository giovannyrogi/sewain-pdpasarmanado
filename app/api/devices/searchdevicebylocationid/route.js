import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const location_id = searchParams.get("location_id");

    if (!location_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "location_id wajib diisi",
          data: [],
        }),
        { status: 400 }
      );
    }

    // Query dengan JOIN ke locations dan users
    const result = await pool.query(
      `
      SELECT
        d.id,
        d.device_name,
        d.status,
        d.assigned_to,
        d.location_id,
        d.last_online_at,
        d.created_at,
        d.updated_at,
        l.location_name,
        u.name AS assigned_username
      FROM devices d
      LEFT JOIN locations l ON d.location_id = l.id
      LEFT JOIN users u ON d.assigned_to = u.id
      WHERE ($1::int IS NULL OR d.location_id = $1)
      ORDER BY d.created_at ASC
      `,
      [location_id || null]
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      device_name: row.device_name,
      status: row.status,
      assigned_to: row.assigned_to,
      assigned_username: row.assigned_username,
      location_id: row.location_id,
      location_name: row.location_name,
      last_online_at: row.last_online_at
        ? moment(row.last_online_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
      created_at: row.created_at
        ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
      updated_at: row.updated_at
        ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data lokasi admin",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
