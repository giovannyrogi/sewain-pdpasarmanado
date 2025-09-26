import pool from "@/lib/dbConfig";
import moment from "moment";

export async function GET(req, { params }) {
  try {
    // Jangan await params — params sudah object
    const { id } = params;

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

    // Ambil data tenant_application
    const tenantSql = `
      SELECT 
        id, renewal_of, user_id, tenant_name, tenant_nik, tenant_phone,
        document_number, ktp_file_path, location_id, room_id,
        start_date, end_date, payment_type, total_payment, down_payment,
        remaining_payment, estimated_installment_1, estimated_installment_1_date,
        estimated_installment_2, estimated_installment_2_date,
        estimated_installment_3, estimated_installment_3_date,
        approval_status, current_step, current_payment_step,
        is_fully_paid
      FROM tenant_application
      WHERE id = $1
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
          room_area, price_per_m2, is_available
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
          id, location_id, floor, base_price
        FROM location_floor_prices
        WHERE id = $1
        LIMIT 1
      `;
      const floorResult = await pool.query(floorSql, [rawRoom.floor_id]);
      floorData = floorResult.rows[0] || null;
    }

    // Gabungkan floor ke rooms (tanpa reassign const)
    const room = rawRoom
      ? {
          ...rawRoom,
          ...(floorData
            ? {
                floor_id: floorData.id, // ubah nama id → floor_id agar tidak duplikat
                floor: floorData.floor,
                base_price: floorData.base_price,
                floor_location_id: floorData.location_id, // kalau mau simpan juga
              }
            : {}),
        }
      : null;

    // Ambil data location hanya jika ada location_id
    let location = null;
    if (tenant.location_id) {
      const locationSql = `
        SELECT 
          id, location_name, address, city
        FROM locations
        WHERE id = $1
        LIMIT 1
      `;
      const locationResult = await pool.query(locationSql, [
        tenant.location_id,
      ]);
      location = locationResult.rows[0] || null;
    }

    // Format tanggal yang perlu diformat
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
