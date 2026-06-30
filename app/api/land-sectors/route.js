import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateLandSectorPayload } from "./validation";

const LAND_MASTER_WRITE_ROLES = [1, 9];
const LAND_MASTER_READ_ROLES = [1, 3, 4, 5, 6, 7, 9];

const mapLandSectorRow = (row) => ({
  id: row.id,
  location_id: row.location_id,
  location_name: row.location_name,
  sector_name: row.sector_name,
  sector_code: row.sector_code,
  description: row.description,
  status: row.status,
  stall_count: Number(row.stall_count || 0),
  available_stall_count: Number(row.available_stall_count || 0),
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

const ensureLocationExists = async (client, locationId) => {
  const result = await client.query(
    "SELECT 1 FROM locations WHERE id = $1 LIMIT 1",
    [locationId],
  );

  return result.rowCount > 0;
};

export async function POST(req) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(LAND_MASTER_WRITE_ROLES);
    if (response) return response;

    const body = await req.json();
    const { values, error } = validateLandSectorPayload(body);
    if (error) return failResponse(error, 400);

    const locationExists = await ensureLocationExists(client, values.location_id);
    if (!locationExists) {
      return failResponse("Lokasi tidak ditemukan.", 404);
    }

    const duplicateName = await client.query(
      `
      SELECT 1
      FROM land_sectors
      WHERE location_id = $1 AND LOWER(sector_name) = LOWER($2)
      LIMIT 1
      `,
      [values.location_id, values.sector_name],
    );

    if (duplicateName.rowCount > 0) {
      return failResponse("Nama sektor sudah terdaftar pada lokasi ini.", 409);
    }

    if (values.sector_code) {
      const duplicateCode = await client.query(
        `
        SELECT 1
        FROM land_sectors
        WHERE location_id = $1 AND LOWER(sector_code) = LOWER($2)
        LIMIT 1
        `,
        [values.location_id, values.sector_code],
      );

      if (duplicateCode.rowCount > 0) {
        return failResponse("Kode sektor sudah terdaftar pada lokasi ini.", 409);
      }
    }

    const result = await client.query(
      `
      INSERT INTO land_sectors (
        location_id, sector_name, sector_code, description, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        values.location_id,
        values.sector_name,
        values.sector_code,
        values.description,
        values.status,
      ],
    );

    return jsonResponse(
      {
        success: true,
        message: "Sektor izin lahan berhasil ditambahkan.",
        data: result.rows[0],
      },
      201,
    );
  } catch (error) {
    return handleApiError(
      "Error creating land sector",
      error,
      "Terjadi kesalahan saat menambah sektor izin lahan.",
    );
  } finally {
    client.release();
  }
}

export async function GET(request) {
  try {
    const { response } = await requireRole(LAND_MASTER_READ_ROLES);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const values = [];
    let locationFilter = "";

    if (locationId) {
      const parsedLocationId = Number(locationId);
      if (!Number.isInteger(parsedLocationId) || parsedLocationId <= 0) {
        return failResponse("ID lokasi tidak valid.", 400);
      }

      values.push(parsedLocationId);
      locationFilter = "WHERE ls.location_id = $1";
    }

    const result = await pool.query(
      `
      SELECT
        ls.id,
        ls.location_id,
        l.location_name,
        ls.sector_name,
        ls.sector_code,
        ls.description,
        ls.status,
        ls.created_at,
        ls.updated_at,
        COUNT(lst.id)::int AS stall_count,
        COUNT(lst.id) FILTER (WHERE lst.status = 'available')::int AS available_stall_count
      FROM land_sectors ls
      JOIN locations l ON l.id = ls.location_id
      LEFT JOIN land_stalls lst ON lst.sector_id = ls.id
      ${locationFilter}
      GROUP BY ls.id, l.location_name
      ORDER BY ls.created_at DESC
      `,
      values,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data sektor izin lahan.",
      data: result.rows.map(mapLandSectorRow),
    });
  } catch (error) {
    return handleApiError(
      "Error fetching land sectors",
      error,
      "Terjadi kesalahan saat mengambil data sektor izin lahan.",
    );
  }
}
