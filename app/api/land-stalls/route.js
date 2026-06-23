import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateLandStallPayload } from "./validation";

const LAND_MASTER_ROLES = [1, 9];

const mapLandStallRow = (row) => ({
  id: row.id,
  location_id: row.location_id,
  location_name: row.location_name,
  sector_id: row.sector_id,
  sector_name: row.sector_name,
  stall_number: row.stall_number,
  stall_length: row.stall_length,
  stall_width: row.stall_width,
  stall_area: row.stall_area,
  price_per_m2: row.price_per_m2,
  status: row.status,
  notes: row.notes,
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

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

export async function POST(req) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_MASTER_ROLES);
    if (response) return response;

    const body = await req.json();
    const { values, error } = validateLandStallPayload(body);
    if (error) return failResponse(error, 400);

    const sectorIsValid = await ensureSectorBelongsToLocation(
      client,
      values.sector_id,
      values.location_id,
    );

    if (!sectorIsValid) {
      return failResponse("Sektor tidak valid untuk lokasi yang dipilih.", 400);
    }

    const duplicateStall = await client.query(
      `
      SELECT 1
      FROM land_stalls
      WHERE sector_id = $1 AND LOWER(stall_number) = LOWER($2)
      LIMIT 1
      `,
      [values.sector_id, values.stall_number],
    );

    if (duplicateStall.rowCount > 0) {
      return failResponse("Nomor lapak sudah terdaftar pada sektor ini.", 409);
    }

    const result = await client.query(
      `
      INSERT INTO land_stalls (
        location_id, sector_id, stall_number, stall_length, stall_width,
        price_per_m2, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      ],
    );

    return jsonResponse(
      {
        success: true,
        message: "Lapak izin lahan berhasil ditambahkan.",
        data: result.rows[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(
      "Error creating land stall",
      error,
      "Terjadi kesalahan saat menambah lapak izin lahan.",
    );
  } finally {
    client.release();
  }
}

export async function GET(request) {
  try {
    const { response } = await requireRole(LAND_MASTER_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const sectorId = searchParams.get("sector_id");
    const where = [];
    const values = [];

    if (locationId) {
      const parsedLocationId = Number(locationId);
      if (!Number.isInteger(parsedLocationId) || parsedLocationId <= 0) {
        return failResponse("ID lokasi tidak valid.", 400);
      }

      values.push(parsedLocationId);
      where.push(`lst.location_id = $${values.length}`);
    }

    if (sectorId) {
      const parsedSectorId = Number(sectorId);
      if (!Number.isInteger(parsedSectorId) || parsedSectorId <= 0) {
        return failResponse("ID sektor tidak valid.", 400);
      }

      values.push(parsedSectorId);
      where.push(`lst.sector_id = $${values.length}`);
    }

    const result = await pool.query(
      `
      SELECT
        lst.id,
        lst.location_id,
        l.location_name,
        lst.sector_id,
        ls.sector_name,
        lst.stall_number,
        lst.stall_length,
        lst.stall_width,
        lst.stall_area,
        lst.price_per_m2,
        lst.status,
        lst.notes,
        lst.created_at,
        lst.updated_at
      FROM land_stalls lst
      JOIN locations l ON l.id = lst.location_id
      JOIN land_sectors ls ON ls.id = lst.sector_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY lst.created_at DESC
      `,
      values,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data lapak izin lahan.",
      data: result.rows.map(mapLandStallRow),
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land stalls",
      error,
      "Terjadi kesalahan saat mengambil data lapak izin lahan.",
    );
  }
}
