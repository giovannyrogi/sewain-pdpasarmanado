import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import {
  validateLandSectorId,
  validateLandSectorPayload,
} from "../validation";

const LAND_MASTER_ROLES = [1, 9];

const ensureLocationExists = async (client, locationId) => {
  const result = await client.query(
    "SELECT 1 FROM locations WHERE id = $1 LIMIT 1",
    [locationId],
  );

  return result.rowCount > 0;
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_MASTER_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: sectorId, error: idError } = validateLandSectorId(rawId);
    if (idError) return failResponse(idError, 400);

    const body = await request.json();
    const { values, error } = validateLandSectorPayload(body);
    if (error) return failResponse(error, 400);

    const locationExists = await ensureLocationExists(client, values.location_id);
    if (!locationExists) {
      return failResponse("Lokasi tidak ditemukan.", 404);
    }

    const existingSector = await client.query(
      "SELECT id FROM land_sectors WHERE id = $1 LIMIT 1",
      [sectorId],
    );

    if (existingSector.rowCount === 0) {
      return failResponse("Sektor izin lahan tidak ditemukan.", 404);
    }

    const duplicateName = await client.query(
      `
      SELECT 1
      FROM land_sectors
      WHERE location_id = $1 AND LOWER(sector_name) = LOWER($2) AND id <> $3
      LIMIT 1
      `,
      [values.location_id, values.sector_name, sectorId],
    );

    if (duplicateName.rowCount > 0) {
      return failResponse("Nama sektor sudah terdaftar pada lokasi ini.", 409);
    }

    if (values.sector_code) {
      const duplicateCode = await client.query(
        `
        SELECT 1
        FROM land_sectors
        WHERE location_id = $1 AND LOWER(sector_code) = LOWER($2) AND id <> $3
        LIMIT 1
        `,
        [values.location_id, values.sector_code, sectorId],
      );

      if (duplicateCode.rowCount > 0) {
        return failResponse("Kode sektor sudah terdaftar pada lokasi ini.", 409);
      }
    }

    const result = await client.query(
      `
      UPDATE land_sectors
      SET
        location_id = $1,
        sector_name = $2,
        sector_code = $3,
        description = $4,
        status = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
      `,
      [
        values.location_id,
        values.sector_name,
        values.sector_code,
        values.description,
        values.status,
        sectorId,
      ],
    );

    return jsonResponse({
      success: true,
      message: "Sektor izin lahan berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    return handleApiError(
      "Error updating land sector",
      error,
      "Terjadi kesalahan saat memperbarui sektor izin lahan.",
    );
  } finally {
    client.release();
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireRole(LAND_MASTER_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: sectorId, error } = validateLandSectorId(rawId);
    if (error) return failResponse(error, 400);

    const stallResult = await pool.query(
      `
      SELECT stall_number
      FROM land_stalls
      WHERE sector_id = $1
      ORDER BY stall_number ASC
      `,
      [sectorId],
    );

    if (stallResult.rowCount > 0) {
      const stallList = stallResult.rows
        .map((stall) => stall.stall_number)
        .join(", ");

      return failResponse(
        `Sektor tidak dapat dihapus karena masih memiliki lahan: ${stallList}.`,
        409,
      );
    }

    const result = await pool.query(
      "DELETE FROM land_sectors WHERE id = $1 RETURNING *",
      [sectorId],
    );

    if (result.rowCount === 0) {
      return failResponse("Sektor izin lahan tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Sektor izin lahan berhasil dihapus.",
    });
  } catch (error) {
    return handleApiError(
      "Error deleting land sector",
      error,
      "Terjadi kesalahan saat menghapus sektor izin lahan.",
    );
  }
}
