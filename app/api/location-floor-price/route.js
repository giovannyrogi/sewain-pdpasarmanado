import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateFloorPayload } from "./validation";

const MASTER_DATA_ROLES = [1, 2];

// CREATE lantai
export async function POST(req) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const body = await req.json();
    const { payload, error } = validateFloorPayload(body);

    if (error) {
      return failResponse(error, 400);
    }

    const locationExists = await pool.query(
      `SELECT 1 FROM locations WHERE id = $1 LIMIT 1`,
      [payload.location_id],
    );

    if (locationExists.rows.length === 0) {
      return failResponse("Lokasi tidak ditemukan.", 404);
    }

    const duplicateFloor = await pool.query(
      `
      SELECT 1
      FROM location_floor_prices
      WHERE location_id = $1
        AND LOWER(floor) = LOWER($2)
      LIMIT 1
      `,
      [payload.location_id, payload.floor],
    );

    if (duplicateFloor.rows.length > 0) {
      return failResponse("Lantai sudah terdaftar pada lokasi ini.", 409);
    }

    const result = await pool.query(
      `
      INSERT INTO location_floor_prices (location_id, floor)
      VALUES ($1, $2)
      RETURNING *
      `,
      [payload.location_id, payload.floor],
    );

    return jsonResponse(
      {
        success: true,
        message: "Berhasil menambah Lantai baru",
        data: result.rows[0],
      },
      201,
    );
  } catch (err) {
    return handleApiError("error create floor", err, "Gagal menambah lantai.");
  }
}

// READ Data floor
export async function GET() {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

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
      ORDER BY lfp.created_at DESC`,
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

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data lokasi dan lantai",
      data: rows,
    });
  } catch (err) {
    return handleApiError("error get floors", err, "Gagal mengambil data lantai.");
  }
}
