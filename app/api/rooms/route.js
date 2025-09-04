import pool from "@/lib/dbConfig";
import moment from "moment";

// CREATE Room
export async function POST(req) {
  try {
    const body = await req.json();
    const { location_id, room_number, floor, room_length, room_width, is_available } = body;

    const result = await pool.query(
      `INSERT INTO rooms (location_id, room_number, floor, room_length, room_width, is_available)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [location_id, room_number, floor, room_length, room_width, is_available]
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah room baru",
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

export async function GET(req) {
  try {
    const result = await pool.query(
      `SELECT 
          rooms.id,
          rooms.room_number,
          rooms.floor,
          rooms.room_length,
          rooms.room_width,
          rooms.is_available,
          rooms.updated_at,
          rooms.created_at,
          rooms.location_id,
          locations.location_name
        FROM rooms
        JOIN locations ON rooms.location_id = locations.id
        ORDER BY rooms.created_at DESC`
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      location_id: row.location_id,
      location_name: row.location_name,
      room_number: row.room_number,
      room_length: row.room_length,
      room_width: row.room_width,
      floor: row.floor,
      is_available: row.is_available,
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
        message: "Berhasil mengambil data rooms",
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
