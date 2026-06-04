import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";

const MASTER_DATA_ROLES = [1, 2];

// CREATE Room
export async function POST(req) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const body = await req.json();
    const {
      location_id,
      room_number,
      floor_id,
      room_length,
      room_width,
      status,
      price_per_m2,
      notes,
      price_type,
      room_area,
    } = body;

    // Validasi field wajib
    if (!location_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Lokasi wajib diisi!" }),
        { status: 400 },
      );
    }

    if (!floor_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Lantai wajib diisi!" }),
        { status: 400 },
      );
    }

    if (!room_number) {
      return new Response(
        JSON.stringify({ success: false, message: "Nomor kamar wajib diisi!" }),
        { status: 400 },
      );
    }

    // if (!room_length || !room_width) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       message: "Panjang dan lebar kamar wajib diisi!",
    //     }),
    //     { status: 400 },
    //   );
    // }

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, message: "Status wajib diisi!" }),
        { status: 400 },
      );
    }

    if (price_per_m2 < 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Harga wajib diisi!" }),
        { status: 400 },
      );
    }

    if (notes) {
      if (notes.length > 150) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Notes maksimal 150 karakter!",
          }),
          { status: 400 },
        );
      }
    }

    // Validasi apakah nomor kamar sudah terdaftar pada lokasi yang dipilih
    const checkRoom = await pool.query(
      `SELECT * FROM rooms WHERE location_id=$1 AND room_number=$2`,
      [location_id, room_number],
    );
    if (checkRoom.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nomor ruangan sudah terdaftar pada lokasi yang dipilih!",
        }),
        { status: 400 },
      );
    }

    const result = await pool.query(
      `INSERT INTO rooms 
       (location_id, room_number, floor_id, room_length, room_width, price_per_m2, status, notes, price_type, room_area)
       VALUES ($1, $2, $3, $4, $5, $6, $7 , $8, $9, $10)
       RETURNING *`,
      [
        location_id,
        room_number,
        floor_id,
        room_length || 0,
        room_width || 0,
        price_per_m2 || 0,
        status,
        notes,
        price_type,
        room_area,
      ],
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah room baru",
        data: result.rows[0],
      }),
      { status: 201 },
    );
  } catch (err) {
    console.log(err, "err");
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const result = await pool.query(
      `
      SELECT 
         r.id,
         r.room_number,
         r.room_length,
         r.room_width,
         r.room_area,
         r.status,
         r.updated_at,
         r.created_at,
         r.location_id,
         r.price_per_m2,
         r.notes,
         r.price_type,
         l.location_name,
         f.id AS floor_id,
         f.floor AS room_floor
      FROM rooms r
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN location_floor_prices f 
        ON r.floor_id = f.id
      ORDER BY r.created_at DESC
      `,
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      location_id: row.location_id,
      location_name: row.location_name,
      room_number: row.room_number,
      room_length: row.room_length,
      room_width: row.room_width,
      room_area: row.room_area,
      notes: row.notes,
      price_per_m2: row.price_per_m2,
      floor_id: row.floor_id,
      room_floor: row.room_floor,
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
        message: "Berhasil mengambil data rooms dengan floor price",
        data: rows,
      }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 },
    );
  }
}
