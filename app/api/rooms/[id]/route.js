import pool from "@/lib/dbConfig";
import moment from "moment";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL (rooms.id)
    const body = await request.json();
    const {
      location_id,
      room_number,
      floor_id,
      room_length,
      room_width,
      is_available,
      price_per_m2,
      notes,
    } = body;

    // Ambil data room sekarang
    const roomRes = await pool.query(`SELECT * FROM rooms WHERE id=$1`, [id]);
    if (roomRes.rowCount === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Ruangan tidak ditemukan" }),
        { status: 404 }
      );
    }
    const roomData = roomRes.rows[0];

    const wantsToChangeAvailability =
      typeof is_available !== "undefined" &&
      is_available !== roomData.is_available;

    if (wantsToChangeAvailability) {
      // Ambil semua tenant_application + tenant_name via join tenant_identities
      const tenantRes = await pool.query(
        `
        SELECT ta.id, ti.full_name AS tenant_name, ta.start_date, ta.end_date
        FROM tenant_application ta
        JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
        WHERE ta.room_id = $1
        `,
        [id]
      );

      if (tenantRes.rowCount > 0) {
        const today = moment(new Date()).format("YYYY-MM-DD");
        console.log("tenantRes", tenantRes);
        console.log("today", today);

        for (const t of tenantRes.rows) {
          const start = t.start_date
            ? moment(t.start_date).format("YYYY-MM-DD")
            : null;
          const end = t.end_date
            ? moment(t.end_date).format("YYYY-MM-DD")
            : null;

          console.log("start", start);
          console.log("end", end);

          // Jika tanggal kosong → tetap dianggap blocking
          if (!start || !end) {
            return new Response(
              JSON.stringify({
                success: false,
                message: `Ruangan ini terdaftar pada permohonan penyewa "${t.tenant_name}". Status ketersediaan tidak dapat diubah.`,
              }),
              { status: 400 }
            );
          }

          // Blok hanya kalau masa sewa masih aktif (end_date >= hari ini)
          if (end >= today) {
            return new Response(
              JSON.stringify({
                success: false,
                message: `Ruangan sedang digunakan oleh "${t.tenant_name}" sampai ${end}. Status ketersediaan tidak dapat diubah.`,
              }),
              { status: 400 }
            );
          }
        }
      }
    }

    // Update data room
    const result = await pool.query(
      `UPDATE rooms 
         SET location_id = $1,
             room_number = $2,
             floor_id    = $3,
             room_length = $4,
             room_width  = $5,
             is_available= $6,
             price_per_m2= $7,
             notes = $8
       WHERE id = $9
       RETURNING *`,
      [
        location_id,
        room_number,
        floor_id,
        room_length,
        room_width,
        typeof is_available === "undefined"
          ? roomData.is_available
          : is_available,
        price_per_m2,
        notes,
        id,
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data Ruangan",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error update Ruangan", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

// DELETE Rooms
export async function DELETE(request, context) {
  try {
    const { id } = await context.params;

    // Cek apakah ada tenant yang menggunakan room ini (join tenant_identities)
    const checkTenant = await pool.query(
      `
      SELECT ti.full_name AS tenant_name
      FROM tenant_application ta
      JOIN tenant_identities ti ON ta.tenant_identity_id = ti.id
      WHERE ta.room_id = $1
      `,
      [id]
    );

    if (checkTenant.rows.length > 0) {
      const tenantList = checkTenant.rows.map((t) => t.tenant_name).join(", ");

      return new Response(
        JSON.stringify({
          success: false,
          message: `Ruangan ini tidak bisa dihapus, karena masih dipakai oleh penyewa: ${tenantList}`,
        }),
        { status: 200 }
      );
    }

    // Jika aman, hapus ruangan
    const result = await pool.query(
      `DELETE FROM rooms WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Ruangan tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menghapus ruangan",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error delete ruangan", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message,
      }),
      { status: 500 }
    );
  }
}
