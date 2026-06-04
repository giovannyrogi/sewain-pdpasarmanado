import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser } from "@/app/utils/auth";

// GET /api/locations/my?location_id=xxx
export async function GET(req) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

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

    const result = await pool.query(
      `SELECT * FROM locations WHERE id = $1 ORDER BY created_at DESC`,
      [location_id]
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      owner_name: row.owner_name,
      location_name: row.location_name,
      address: row.address,
      active_until: row.active_until
        ? moment(row.active_until).format("YYYY-MM-DD HH:mm:ss")
        : null,
      created_at: row.created_at
        ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
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
