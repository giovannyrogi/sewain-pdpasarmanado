import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
  parsePositiveInteger,
} from "@/app/utils/apiValidation";
import { validateLocationPayload } from "../validation";

const MASTER_DATA_ROLES = [1, 2, 9];

// UPDATE lokasi by id
export async function PUT(request, { params }) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id } = await params;
    const parsedId = parsePositiveInteger(id, "ID lokasi");

    if (parsedId.error) {
      return failResponse(parsedId.error, 400);
    }

    const body = await request.json();
    const { payload, error } = validateLocationPayload(body);

    if (error) {
      return failResponse(error, 400);
    }

    const duplicateName = await pool.query(
      `
      SELECT 1
      FROM locations
      WHERE LOWER(location_name) = LOWER($1)
        AND id != $2
      LIMIT 1
      `,
      [payload.location_name, parsedId.value],
    );

    if (duplicateName.rows.length > 0) {
      return failResponse("Lokasi sudah terdaftar.", 409);
    }

    const duplicateCode = await pool.query(
      `
      SELECT 1
      FROM locations
      WHERE LOWER(location_code) = LOWER($1)
        AND id != $2
      LIMIT 1
      `,
      [payload.location_code, parsedId.value],
    );

    if (duplicateCode.rows.length > 0) {
      return failResponse("Kode lokasi sudah terdaftar.", 409);
    }

    const result = await pool.query(
      `
      UPDATE locations
      SET
        location_name = $1,
        city = $2,
        street_address = $3,
        location_code = $4,
        province = $5,
        district = $6,
        kelurahan = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
      `,
      [
        payload.location_name,
        payload.city,
        payload.street_address,
        payload.location_code,
        payload.province,
        payload.district,
        payload.kelurahan,
        parsedId.value,
      ],
    );

    if (result.rows.length === 0) {
      return failResponse("Lokasi tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil mengupdate lokasi",
      data: result.rows[0],
    });
  } catch (err) {
    return handleApiError("error update location", err, "Gagal mengupdate lokasi.");
  }
}

// DELETE lokasi by id
export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id } = await params;
    const parsedId = parsePositiveInteger(id, "ID lokasi");

    if (parsedId.error) {
      return failResponse(parsedId.error, 400);
    }

    const checkRooms = await pool.query(
      `SELECT room_number FROM rooms WHERE location_id = $1 ORDER BY room_number ASC`,
      [parsedId.value],
    );

    if (checkRooms.rows.length > 0) {
      const roomList = checkRooms.rows.map((r) => r.room_number).join(", ");

      return failResponse(
        `Lokasi tidak bisa dihapus, masih terdaftar dengan ruangan: ${roomList}`,
        409,
      );
    }

    const checkLandSectors = await pool.query(
      `
      SELECT sector_name
      FROM land_sectors
      WHERE location_id = $1
      ORDER BY sector_name ASC
      `,
      [parsedId.value],
    );

    if (checkLandSectors.rows.length > 0) {
      const sectorList = checkLandSectors.rows
        .map((sector) => sector.sector_name)
        .join(", ");

      return failResponse(
        `Lokasi tidak bisa dihapus, masih terdaftar dengan sektor izin lahan: ${sectorList}`,
        409,
      );
    }

    const result = await pool.query(
      `DELETE FROM locations WHERE id = $1 RETURNING *`,
      [parsedId.value],
    );

    if (result.rows.length === 0) {
      return failResponse("Lokasi tidak ditemukan atau sudah dihapus.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Berhasil menghapus lokasi.",
    });
  } catch (err) {
    return handleApiError("error delete location", err, "Gagal menghapus lokasi.");
  }
}
