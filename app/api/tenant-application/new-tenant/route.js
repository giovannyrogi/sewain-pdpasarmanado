import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireRole } from "@/app/utils/auth";

const TENANT_APPLICATION_ROLES = [1, 2];

export async function GET(req) {
  try {
    const { response } = await requireRole(TENANT_APPLICATION_ROLES);
    if (response) return response;

    const result = await pool.query(
      `
      SELECT 
        ti.id,
        ti.user_id,
        ti.nik,
        ti.full_name,
        ti.ktp_file_path,
        ti.birth_place,
        ti.birth_date,
        ti.nationality,
        ti.religion,
        ti.occupation,
        ti.street_address,
        ti.rt,
        ti.rw,
        ti.kelurahan,
        ti.district,
        ti.city,
        ti.province,
        ti.postal_code,
        ti.phone,
        ti.status,
        ti.notes,
        ti.land_permit_status,
        ti.is_room_rental_registered,
        ti.is_land_permit_registered,
        ti.created_at,
        ti.updated_at
      FROM tenant_identities ti
      WHERE 
        ti.status = 'active'
        AND ti.is_room_rental_registered = TRUE
      ORDER BY ti.created_at DESC
      `
    );

    const rows = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      nik: row.nik,
      full_name: row.full_name,
      ktp_file_path: row.ktp_file_path,
      birth_place: row.birth_place,
      birth_date: row.birth_date,
      nationality: row.nationality,
      religion: row.religion,
      occupation: row.occupation,
      status: row.status,
      notes: row.notes,
      land_permit_status: row.land_permit_status,
      is_room_rental_registered: row.is_room_rental_registered,
      is_land_permit_registered: row.is_land_permit_registered,

      street_address: row.street_address,
      rt: row.rt,
      rw: row.rw,
      kelurahan: row.kelurahan,
      district: row.district,
      city: row.city,
      province: row.province,
      postal_code: row.postal_code,
      phone: row.phone,

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
        message:
          "Berhasil mengambil data tenant identities berstatus aktif dan tidak sedang digunakan atau dalam proses sewa",
        data: rows,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error GET tenant identities:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
