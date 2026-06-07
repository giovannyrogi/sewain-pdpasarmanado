import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireAuthenticatedUser, requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateRoomPayload } from "./validation";

const MASTER_DATA_ROLES = [1, 2];

const mapRoomRow = (row) => ({
  id: row.id,
  location_id: row.location_id,
  location_name: row.location_name,
  room_number: row.room_number,
  room_length: row.room_length,
  room_width: row.room_width,
  room_area: row.room_area,
  notes: row.notes,
  price_per_m2: row.price_per_m2,
  floor_id: row.floor_id,
  room_floor: row.room_floor,
  status: row.status,
  price_type: row.price_type,
  updated_at: row.updated_at
    ? moment(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
  created_at: row.created_at
    ? moment(row.created_at).format("YYYY-MM-DD HH:mm:ss")
    : null,
});

const ensureFloorBelongsToLocation = async (client, locationId, floorId) => {
  const result = await client.query(
    `
    SELECT 1
    FROM location_floor_prices
    WHERE id = $1 AND location_id = $2
    LIMIT 1
    `,
    [floorId, locationId],
  );

  return result.rowCount > 0;
};

export async function POST(req) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const body = await req.json();
    const { values, error } = validateRoomPayload(body);
    if (error) return failResponse(error, 400);

    const client = await pool.connect();
    try {
      const floorIsValid = await ensureFloorBelongsToLocation(
        client,
        values.location_id,
        values.floor_id,
      );

      if (!floorIsValid) {
        return failResponse("Lantai tidak valid untuk lokasi yang dipilih.", 400);
      }

      const duplicateRoom = await client.query(
        `
        SELECT 1
        FROM rooms
        WHERE location_id = $1 AND LOWER(room_number) = LOWER($2)
        LIMIT 1
        `,
        [values.location_id, values.room_number],
      );

      if (duplicateRoom.rowCount > 0) {
        return failResponse(
          "Nomor ruangan sudah terdaftar pada lokasi yang dipilih.",
          409,
        );
      }

      const result = await client.query(
        `
        INSERT INTO rooms (
          location_id, room_number, floor_id, room_length, room_width,
          price_per_m2, status, notes, price_type, room_area
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
          values.location_id,
          values.room_number,
          values.floor_id,
          values.room_length,
          values.room_width,
          values.price_per_m2,
          values.status,
          values.notes,
          values.price_type,
          values.room_area,
        ],
      );

      return jsonResponse(
        {
          success: true,
          message: "Ruangan berhasil ditambahkan.",
          data: result.rows[0],
        },
        201,
      );
    } finally {
      client.release();
    }
  } catch (error) {
    return handleApiError(
      "Error creating room",
      error,
      "Terjadi kesalahan saat menambah data ruangan.",
    );
  }
}

export async function GET() {
  try {
    const { response } = await requireAuthenticatedUser();
    if (response) return response;

    const result = await pool.query(
      `
      SELECT 
        r.id,
        r.room_number,
        r.room_length,
        r.room_width,
        r.room_area,
        r.status,
        r.updated_at,
        r.created_at,
        r.location_id,
        r.price_per_m2,
        r.notes,
        r.price_type,
        l.location_name,
        f.id AS floor_id,
        f.floor AS room_floor
      FROM rooms r
      JOIN locations l ON r.location_id = l.id
      LEFT JOIN location_floor_prices f ON r.floor_id = f.id
      ORDER BY r.created_at DESC
      `,
    );

    return jsonResponse({
      success: true,
      message: "Berhasil mengambil data ruangan.",
      data: result.rows.map(mapRoomRow),
    });
  } catch (error) {
    return handleApiError(
      "Error fetching rooms",
      error,
      "Terjadi kesalahan saat mengambil data ruangan.",
    );
  }
}
