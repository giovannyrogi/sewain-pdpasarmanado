import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateLandStallId, validateLandStallPayload } from "../validation";

const LAND_MASTER_ROLES = [1, 9];

const ensureSectorBelongsToLocation = async (client, sectorId, locationId) => {
  const result = await client.query(
    `
    SELECT 1
    FROM land_sectors
    WHERE id = $1 AND location_id = $2
    LIMIT 1
    `,
    [sectorId, locationId],
  );

  return result.rowCount > 0;
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_MASTER_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: stallId, error: idError } = validateLandStallId(rawId);
    if (idError) return failResponse(idError, 400);

    const body = await request.json();
    const { values, error } = validateLandStallPayload(body);
    if (error) return failResponse(error, 400);

    const existingStall = await client.query(
      "SELECT status FROM land_stalls WHERE id = $1 LIMIT 1",
      [stallId],
    );

    if (existingStall.rowCount === 0) {
      return failResponse("Lapak izin lahan tidak ditemukan.", 404);
    }

    const sectorIsValid = await ensureSectorBelongsToLocation(
      client,
      values.sector_id,
      values.location_id,
    );

    if (!sectorIsValid) {
      return failResponse("Sektor tidak valid untuk lokasi yang dipilih.", 400);
    }

    const activePermit = await client.query(
      `
      SELECT lpa.id
      FROM land_permit_applications lpa
      WHERE lpa.stall_id = $1
        AND lpa.permit_status = 'active'
      LIMIT 1
      `,
      [stallId],
    );

    if (activePermit.rowCount > 0 && values.status !== "occupied") {
      return failResponse(
        "Lapak masih memiliki izin aktif. Status hanya dapat tetap sebagai terisi.",
        409,
      );
    }

    const duplicateStall = await client.query(
      `
      SELECT 1
      FROM land_stalls
      WHERE sector_id = $1 AND LOWER(stall_number) = LOWER($2) AND id <> $3
      LIMIT 1
      `,
      [values.sector_id, values.stall_number, stallId],
    );

    if (duplicateStall.rowCount > 0) {
      return failResponse("Nomor lapak sudah terdaftar pada sektor ini.", 409);
    }

    const result = await client.query(
      `
      UPDATE land_stalls
      SET
        location_id = $1,
        sector_id = $2,
        stall_number = $3,
        stall_length = $4,
        stall_width = $5,
        price_per_m2 = $6,
        status = $7,
        notes = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [
        values.location_id,
        values.sector_id,
        values.stall_number,
        values.stall_length,
        values.stall_width,
        values.price_per_m2,
        values.status,
        values.notes,
        stallId,
      ],
    );

    return jsonResponse({
      success: true,
      message: "Lapak izin lahan berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    return handleApiError(
      "Error updating land stall",
      error,
      "Terjadi kesalahan saat memperbarui lapak izin lahan.",
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
    const { value: stallId, error } = validateLandStallId(rawId);
    if (error) return failResponse(error, 400);

    const activePermit = await pool.query(
      `
      SELECT id
      FROM land_permit_applications
      WHERE stall_id = $1
        AND approval_status IN ('proses', 'approved')
      LIMIT 1
      `,
      [stallId],
    );

    if (activePermit.rowCount > 0) {
      return failResponse(
        "Lapak tidak dapat dihapus karena sudah digunakan pada permohonan izin lahan.",
        409,
      );
    }

    const result = await pool.query(
      "DELETE FROM land_stalls WHERE id = $1 RETURNING *",
      [stallId],
    );

    if (result.rowCount === 0) {
      return failResponse("Lapak izin lahan tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Lapak izin lahan berhasil dihapus.",
    });
  } catch (error) {
    return handleApiError(
      "Error deleting land stall",
      error,
      "Terjadi kesalahan saat menghapus lapak izin lahan.",
    );
  }
}
