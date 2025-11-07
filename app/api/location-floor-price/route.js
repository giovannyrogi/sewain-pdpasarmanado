import pool from "@/lib/dbConfig";
import moment from "moment";

// CREATE lokasi
export async function POST(req) {
  try {
    const body = await req.json();
    const { location_id, floor } = body;

    // validasi field wajib
    if (!location_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Lokasi wajib diisi!" }),
        { status: 200 }
      );
    }

    if (!floor) {
      return new Response(
        JSON.stringify({ success: false, message: "Lantai wajib diisi!" }),
        { status: 200 }
      );
    }

    // validasi apakah lantai sudah terdaftar pada lokasi yang dipilih
    const checkFloor = await pool.query(
      `SELECT 1 FROM location_floor_prices WHERE location_id = $1 AND floor = $2`,
      [location_id, floor]
    );
    if (checkFloor.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Lantai sudah terdaftar pada lokasi ini!",
        }),
        { status: 200 }
      );
    }

    const result = await pool.query(
      `INSERT INTO location_floor_prices (location_id, floor) VALUES ($1, $2) RETURNING *`,
      [location_id, floor]
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah Lantai baru",
        data: result.rows[0],
      }),
      { status: 201 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

// READ Data floor
export async function GET(req) {
  try {
    const result = await pool.query(
      `SELECT 
        lfp.id,
        lfp.location_id,
        loc.location_name,
        lfp.floor,
        lfp.created_at,
        lfp.updated_at
      FROM location_floor_prices lfp
      JOIN locations loc ON loc.id = lfp.location_id
      ORDER BY lfp.created_at DESC`
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      location_id: row.location_id,
      location_name: row.location_name,
      floor: row.floor,
      updated_at: row.updated_at
        ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
      created_at: row.created_at
        ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
        : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data lokasi dan lantai",
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
