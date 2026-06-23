import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateLocationPayload } from "./validation";

const MASTER_DATA_ROLES = [1, 2, 9];

// CREATE lokasi
export async function POST(req) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const body = await req.json();
    const { payload, error } = validateLocationPayload(body);

    if (error) {
      return failResponse(error, 400);
    }

    const duplicateName = await pool.query(
      `SELECT 1 FROM locations WHERE LOWER(location_name) = LOWER($1) LIMIT 1`,
      [payload.location_name],
    );

    if (duplicateName.rows.length > 0) {
      return failResponse("Lokasi sudah terdaftar.", 409);
    }

    const duplicateCode = await pool.query(
      `SELECT 1 FROM locations WHERE LOWER(location_code) = LOWER($1) LIMIT 1`,
      [payload.location_code],
    );

    if (duplicateCode.rows.length > 0) {
      return failResponse("Kode lokasi sudah terdaftar.", 409);
    }

    const result = await pool.query(
      `INSERT INTO locations (
        location_name,
        city,
        street_address,
        location_code,
        kelurahan,
        district,
        province
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        payload.location_name,
        payload.city,
        payload.street_address,
        payload.location_code,
        payload.kelurahan,
        payload.district,
        payload.province,
      ],
    );

    return jsonResponse(
      {
        success: true,
        message: "Berhasil menambah lokasi baru",
        data: result.rows[0],
      },
      201,
    );
  } catch (err) {
    return handleApiError("error create location", err, "Gagal menambah lokasi.");
  }
}

// READ Data Location
export async function GET() {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const result = await pool.query(`SELECT * FROM locations ORDER BY created_at DESC`);
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

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data lokasi",
      data: rows,
    });
  } catch (err) {
    return handleApiError("error get locations", err, "Gagal mengambil data lokasi.");
  }
}
