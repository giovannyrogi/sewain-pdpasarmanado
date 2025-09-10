import pool from "@/lib/dbConfig";
import moment from "moment";

// CREATE Room
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      location_id,
      room_number,
      floor_id,
      room_length,
      room_width,
      is_available,
      price_per_m2,
    } = body;

    const result = await pool.query(
      `INSERT INTO rooms 
       (location_id, room_number, floor_id, room_length, room_width, price_per_m2, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        location_id,
        room_number,
        floor_id,
        room_length,
        room_width,
        price_per_m2 || 0,
        is_available,
      ]
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
    console.log(err, "err");

    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const result = await pool.query(
      `
      SELECT 
         r.id,
         r.room_number,
         r.room_length,
         r.room_width,
         r.room_area,
         r.is_available,
         r.updated_at,
         r.created_at,
         r.location_id,
         r.price_per_m2,
         l.location_name,
         f.id AS floor_id,
         f.floor AS room_floor,
         f.base_price
      FROM rooms r
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN location_floor_prices f 
        ON r.floor_id = f.id
      ORDER BY r.created_at DESC
      `
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      location_id: row.location_id,
      location_name: row.location_name,
      room_number: row.room_number,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      price_per_m2: row.price_per_m2, 
      floor_id: row.floor_id,
      room_floor: row.room_floor,
      base_price: row.base_price,
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
        message: "Berhasil mengambil data rooms dengan floor price",
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
