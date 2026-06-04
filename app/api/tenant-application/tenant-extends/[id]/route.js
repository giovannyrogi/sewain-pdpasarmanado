import pool from "@/lib/dbConfig";
import moment from "moment";
import { requireRole } from "@/app/utils/auth";

const TENANT_APPLICATION_ROLES = [1, 2];

export async function GET(req, { params }) {
  try {
    const { response } = await requireRole(TENANT_APPLICATION_ROLES);
    if (response) return response;

    const { id } = await params;

    // validasi id
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing tenant_application id",
        }),
        { status: 400 }
      );
    }

    const tenantId = parseInt(id, 10);
    if (Number.isNaN(tenantId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid tenant_application id",
        }),
        { status: 400 }
      );
    }

    // Ambil data tenant_application + tenant_name dari tenant_identities
    const tenantSql = `
      SELECT 
        ta.id,
        ta.renewal_of,
        ta.user_id,
        ti.full_name AS tenant_name,
        ta.document_number,
        ta.location_id,
        ta.room_id,
        ta.start_date,
        ta.end_date,
        ta.payment_type,
        ta.total_payment,
        ta.down_payment,
        ta.remaining_payment,
        ta.estimated_installment_1,
        ta.estimated_installment_1_date,
        ta.estimated_installment_2,
        ta.estimated_installment_2_date,
        ta.estimated_installment_3,
        ta.estimated_installment_3_date,
        ta.approval_status,
        ta.current_step,
        ta.current_payment_step,
        ta.is_fully_paid
      FROM tenant_application ta
      LEFT JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      WHERE ta.id = $1
      LIMIT 1
    `;
    const tenantResult = await pool.query(tenantSql, [tenantId]);
    if (tenantResult.rowCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tenant application tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    const tenant = tenantResult.rows[0];

    // Ambil data room hanya jika ada room_id
    let rawRoom = null;
    if (tenant.room_id) {
      const roomSql = `
        SELECT 
          id, location_id, room_number, floor_id, room_length, room_width,
          room_area, price_per_m2, status
        FROM rooms
        WHERE id = $1
        LIMIT 1
      `;
      const roomResult = await pool.query(roomSql, [tenant.room_id]);
      rawRoom = roomResult.rows[0] || null;
    }

    // Ambil data location_floor_prices berdasarkan rawRoom.floor_id
    let floorData = null;
    if (rawRoom && rawRoom.floor_id) {
      const floorSql = `
        SELECT 
          id, location_id, floor
        FROM location_floor_prices
        WHERE id = $1
        LIMIT 1
      `;
      const floorResult = await pool.query(floorSql, [rawRoom.floor_id]);
      floorData = floorResult.rows[0] || null;
    }

    const room = rawRoom
      ? {
          ...rawRoom,
          ...(floorData
            ? {
                floor_id: floorData.id,
                floor: floorData.floor,
                floor_location_id: floorData.location_id,
              }
            : {}),
        }
      : null;

    // Ambil data location hanya jika ada location_id
    let location = null;
    if (tenant.location_id) {
      const locationSql = `
        SELECT 
          id, location_name, street_address, city
        FROM locations
        WHERE id = $1
        LIMIT 1
      `;
      const locationResult = await pool.query(locationSql, [
        tenant.location_id,
      ]);
      location = locationResult.rows[0] || null;
    }

    // Format tanggal
    const formattedTenant = {
      ...tenant,
      start_date: tenant.start_date
        ? moment(tenant.start_date).format("YYYY-MM-DD")
        : null,
      end_date: tenant.end_date
        ? moment(tenant.end_date).format("YYYY-MM-DD")
        : null,
      estimated_installment_1_date: tenant.estimated_installment_1_date
        ? moment(tenant.estimated_installment_1_date).format("YYYY-MM-DD")
        : null,
      estimated_installment_2_date: tenant.estimated_installment_2_date
        ? moment(tenant.estimated_installment_2_date).format("YYYY-MM-DD")
        : null,
      estimated_installment_3_date: tenant.estimated_installment_3_date
        ? moment(tenant.estimated_installment_3_date).format("YYYY-MM-DD")
        : null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengambil data tenant beserta relasi",
        data: {
          tenant_application: formattedTenant,
          rooms: room,
          locations: location,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
