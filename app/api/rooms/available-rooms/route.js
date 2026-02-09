import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("location_id");

    let result;

    if (locationId) {
      // Filter rooms hanya untuk lokasi tertentu
      result = await pool.query(
        `
        SELECT 
          rooms.id,
          rooms.room_number,
          rooms.floor_id,
          rooms.room_length,
          rooms.room_width,
          rooms.room_area,
          rooms.price_per_m2,
          rooms.status,
          rooms.updated_at,
          rooms.created_at,
          rooms.location_id,
          rooms.price_type,
          locations.location_name,
          location_floor_prices.floor           
        FROM rooms
        JOIN locations ON rooms.location_id = locations.id
        LEFT JOIN location_floor_prices 
          ON rooms.floor_id = location_floor_prices.id
        WHERE rooms.status = 'available'
          AND rooms.location_id = $1
        ORDER BY rooms.created_at DESC
        `,
        [locationId],
      );
    } else {
      // Jika tidak ada filter, tampilkan semua
      result = await pool.query(
        `
        SELECT 
          rooms.id,
          rooms.room_number,
          rooms.floor_id,
          rooms.room_length,
          rooms.room_width,
          rooms.room_area,
          rooms.price_type,
          rooms.price_per_m2,
          rooms.status,
          rooms.updated_at,
          rooms.created_at,
          rooms.location_id,
          locations.location_name,
          location_floor_prices.floor       
        FROM rooms
        JOIN locations ON rooms.location_id = locations.id
        LEFT JOIN location_floor_prices 
          ON rooms.floor_id = location_floor_prices.id 
        WHERE rooms.status = 'available'
        ORDER BY rooms.created_at DESC
        `,
      );
    }

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
      floor: row.floor,
      status: row.status,
      price_type: row.price_type,
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
        message: "Berhasil mengambil data rooms yang tersedia",
        data: rows,
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Error GET rooms", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 },
    );
  }
}
