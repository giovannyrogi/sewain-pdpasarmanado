import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";

const MASTER_DATA_ROLES = [1, 2];

// CREATE lokasi
export async function POST(req) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const body = await req.json();
    const { location_name, city, street_address, location_code, kelurahan, district, province } = body;

    // Validasi field wajib
    if (!location_name) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!city) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!street_address) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!location_code) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!kelurahan) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!district) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    if (!province) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi!" }),
        { status: 400 }
      );
    }

    // Cek duplikasi Nama Lokasi
    const checkUser = await pool.query(
      `SELECT 1 FROM locations WHERE location_name = $1`,
      [location_name]
    );
    if (checkUser.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Lokasi sudah terdaftar!",
        }),
        { status: 400 }
      );
    }

    // Cek duplikasi Kode Lokasi
    // const checkCode = await pool.query(
    //   `SELECT 1 FROM locations WHERE location_code = $1`,
    //   [location_code]
    // );
    // if (checkCode.rows.length > 0) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       message: "Kode lokasi sudah terdaftar!",
    //     }),
    //     { status: 400 }
    //   );
    // }



    const result = await pool.query(
      `INSERT INTO locations (location_name, city, street_address, location_code, kelurahan, district, province)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [location_name, city, street_address, location_code, kelurahan, district, province]
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menambah lokasi baru",
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

// READ Data Location
export async function GET(req) {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const result = await pool.query(
      `SELECT * FROM locations ORDER BY created_at DESC`
    );
    const rows = result.rows.map((row) => ({
      id: row.id,
      location_name: row.location_name,
      city: row.city,
      street_address: row.street_address,
      kelurahan: row.kelurahan,
      district: row.district,
      province: row.province,
      location_code: row.location_code,
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
        message: "Berhasil mengambil data lokasi",
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
