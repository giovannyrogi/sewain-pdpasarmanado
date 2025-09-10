import pool from "@/lib/dbConfig";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("location_id");

    if (!locationId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter location_id wajib diisi",
        }),
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT 
        id AS floor_id,
        floor,
        base_price
      FROM location_floor_prices
      WHERE location_id = $1
      ORDER BY floor
      `,
      [locationId]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data lantai",
        data: result.rows,
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
