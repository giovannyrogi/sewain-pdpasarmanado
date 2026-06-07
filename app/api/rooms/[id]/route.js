import moment from "moment";
import pool from "@/lib/dbConfig";
import { requireRole } from "@/app/utils/auth";
import {
  failResponse,
  handleApiError,
  jsonResponse,
} from "@/app/utils/apiValidation";
import { validateRoomId, validateRoomPayload } from "../validation";

const MASTER_DATA_ROLES = [1, 2];

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

const ensureRoomStatusCanChange = async (client, roomId, nextStatus, currentStatus) => {
  if (typeof nextStatus === "undefined" || nextStatus === currentStatus) {
    return null;
  }

  const tenantResult = await client.query(
    `
    SELECT ta.id, ti.full_name AS tenant_name, ta.start_date, ta.end_date
    FROM tenant_application ta
    JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
    WHERE ta.room_id = $1
    `,
    [roomId],
  );

  if (tenantResult.rowCount === 0) return null;

  const today = moment().format("YYYY-MM-DD");

  for (const tenant of tenantResult.rows) {
    const start = tenant.start_date
      ? moment(tenant.start_date).format("YYYY-MM-DD")
      : null;
    const end = tenant.end_date ? moment(tenant.end_date).format("YYYY-MM-DD") : null;

    if (!start || !end) {
      return `Ruangan ini masih terdaftar pada permohonan penyewa "${tenant.tenant_name}". Status tidak dapat diubah.`;
    }

    const terminationResult = await client.query(
      `
      SELECT is_terminated, approval_status
      FROM tenant_early_terminations
      WHERE tenant_application_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [tenant.id],
    );

    const termination = terminationResult.rows[0] || null;
    const isTerminatedApproved =
      termination?.is_terminated === true && termination?.approval_status === "approved";

    if (end >= today && !isTerminatedApproved) {
      return `Ruangan sedang digunakan oleh "${tenant.tenant_name}" sampai ${end}. Status tidak dapat diubah.`;
    }

    if (termination && !isTerminatedApproved) {
      return `Kontrak penyewa "${tenant.tenant_name}" belum disetujui terminasi. Status ruangan tidak dapat diubah.`;
    }
  }

  return null;
};

export async function PUT(request, { params }) {
  const client = await pool.connect();

  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: roomId, error: idError } = validateRoomId(rawId);
    if (idError) return failResponse(idError, 400);

    const body = await request.json();
    const { values, error } = validateRoomPayload(body);
    if (error) return failResponse(error, 400);

    const roomResult = await client.query("SELECT * FROM rooms WHERE id = $1 LIMIT 1", [
      roomId,
    ]);

    if (roomResult.rowCount === 0) {
      return failResponse("Ruangan tidak ditemukan.", 404);
    }

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
      WHERE location_id = $1 AND LOWER(room_number) = LOWER($2) AND id <> $3
      LIMIT 1
      `,
      [values.location_id, values.room_number, roomId],
    );

    if (duplicateRoom.rowCount > 0) {
      return failResponse(
        "Nomor ruangan sudah terdaftar pada lokasi yang dipilih.",
        409,
      );
    }

    const statusBlockMessage = await ensureRoomStatusCanChange(
      client,
      roomId,
      values.status,
      roomResult.rows[0].status,
    );

    if (statusBlockMessage) {
      return failResponse(statusBlockMessage, 409);
    }

    const updateResult = await client.query(
      `
      UPDATE rooms SET
        location_id = $1,
        room_number = $2,
        floor_id = $3,
        room_length = $4,
        room_width = $5,
        status = $6,
        price_per_m2 = $7,
        notes = $8,
        price_type = $9,
        room_area = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *
      `,
      [
        values.location_id,
        values.room_number,
        values.floor_id,
        values.room_length,
        values.room_width,
        values.status,
        values.price_per_m2,
        values.notes,
        values.price_type,
        values.room_area,
        roomId,
      ],
    );

    return jsonResponse({
      success: true,
      message: "Data ruangan berhasil diperbarui.",
      data: updateResult.rows[0],
    });
  } catch (error) {
    return handleApiError(
      "Error updating room",
      error,
      "Terjadi kesalahan saat memperbarui data ruangan.",
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request, { params }) {
  try {
    const { response } = await requireRole(MASTER_DATA_ROLES);
    if (response) return response;

    const { id: rawId } = await params;
    const { value: roomId, error } = validateRoomId(rawId);
    if (error) return failResponse(error, 400);

    const tenantResult = await pool.query(
      `
      SELECT ti.full_name AS tenant_name
      FROM tenant_application ta
      JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      WHERE ta.room_id = $1
      `,
      [roomId],
    );

    if (tenantResult.rowCount > 0) {
      const tenantList = tenantResult.rows.map((item) => item.tenant_name).join(", ");
      return failResponse(
        `Ruangan tidak dapat dihapus karena masih dipakai oleh penyewa: ${tenantList}.`,
        409,
      );
    }

    const result = await pool.query("DELETE FROM rooms WHERE id = $1 RETURNING *", [
      roomId,
    ]);

    if (result.rowCount === 0) {
      return failResponse("Ruangan tidak ditemukan.", 404);
    }

    return jsonResponse({
      success: true,
      message: "Ruangan berhasil dihapus.",
    });
  } catch (error) {
    return handleApiError(
      "Error deleting room",
      error,
      "Terjadi kesalahan saat menghapus data ruangan.",
    );
  }
}
