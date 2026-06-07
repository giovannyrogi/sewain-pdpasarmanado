import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";
import { validateFloorPayload } from "../validation";

const MASTER_DATA_ROLES = [1, 2];

// UPDATE lantai by id
export async function PUT(request, { params }) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id } = await params;
    const parsedId = parsePositiveInteger(id, "ID lantai");

    if (parsedId.error) {
      return failResponse(parsedId.error, 400);
    }

    const body = await request.json();
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
        AND id != $3
      LIMIT 1
      `,
      [payload.location_id, payload.floor, parsedId.value],
    );

    if (duplicateFloor.rows.length > 0) {
      return failResponse("Lokasi dan lantai sudah terdaftar, silakan pilih yang lain.", 409);
    }

    const result = await pool.query(
      `
      UPDATE location_floor_prices
      SET
        location_id = $1,
        floor = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [payload.location_id, payload.floor, parsedId.value],
    );

    if (result.rows.length === 0) {
      return failResponse("Data lantai tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil mengubah data Lantai",
      data: result.rows[0],
    });
  } catch (err) {
    return handleApiError("error update floor", err, "Gagal mengubah data lantai.");
  }
}

// DELETE Floor Price
export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id } = await params;
    const parsedId = parsePositiveInteger(id, "ID lantai");

    if (parsedId.error) {
      return failResponse(parsedId.error, 400);
    }

    const checkRooms = await pool.query(
      `SELECT room_number FROM rooms WHERE floor_id = $1 ORDER BY room_number ASC`,
      [parsedId.value],
    );

    if (checkRooms.rows.length > 0) {
      const roomList = checkRooms.rows.map((r) => r.room_number).join(", ");

      return failResponse(
        `Lantai ini tidak bisa dihapus, karena masih terdaftar dengan ruangan: ${roomList}`,
        409,
      );
    }

    const result = await pool.query(
      `
      DELETE FROM location_floor_prices
      WHERE id = $1
      RETURNING *
      `,
      [parsedId.value],
    );

    if (result.rows.length === 0) {
      return failResponse("Data lantai tidak ditemukan atau sudah dihapus.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil menghapus data Lantai",
      data: result.rows[0],
    });
  } catch (err) {
    return handleApiError("error delete floor", err, "Gagal menghapus data lantai.");
  }
}
