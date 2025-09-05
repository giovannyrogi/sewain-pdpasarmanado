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
        ta.id,
        ta.tenant_name,
        ta.tenant_nik,
        ta.tenant_phone,
        ta.ktp_file_path,
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.down_payment,
        ta.remaining_payment,
        ta.approval_status,
        ta.updated_at,
        ta.created_at,
        l.id AS location_id,
        l.location_name,
        r.id AS room_id,
        r.room_number,
        r.floor,
        r.room_length,
        r.room_width
      FROM tenant_application ta
      JOIN rooms r ON ta.room_id = r.id
      JOIN locations l ON ta.location_id = l.id
      ORDER BY ta.created_at DESC`
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      tenant_name: row.tenant_name,
      tenant_nik: row.tenant_nik,
      tenant_phone: row.tenant_phone,
      ktp_file_path: row.ktp_file_path,
      start_date: row.start_date,
      end_date: row.end_date,
      payment_type: row.payment_type,
      total_payment: row.total_payment,
      down_payment: row.down_payment,
      remaining_payment: row.remaining_payment,
      approval_status: row.approval_status,
      location_id: row.location_id,
      location_name: row.location_name,
      room_id: row.room_id,
      room_number: row.room_number,
      floor: row.floor,
      room_length: row.room_length,
      room_width: row.room_width,
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
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
