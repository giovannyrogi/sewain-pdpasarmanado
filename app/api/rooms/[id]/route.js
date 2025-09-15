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
      // Ambil semua tenant_application yang menggunakan ruangan ini
      const tenantRes = await pool.query(
        `SELECT id, tenant_name, start_date, end_date
     FROM tenant_application
     WHERE room_id = $1`,
        [id]
      );

      // Jika tidak ada pemakaian sama sekali -> boleh
      if (tenantRes.rowCount > 0) {
        const today = moment().startOf("day"); // tanggal sekarang

        // Cek setiap tenant_application, jika ada yg blocking -> tolak
        for (const t of tenantRes.rows) {
          const start = t.start_date
            ? moment(t.start_date).startOf("day")
            : null;
          const end = t.end_date ? moment(t.end_date).startOf("day") : null;

          // (3) jika tanggal kosong block
          if (!start || !end) {
            return new Response(
              JSON.stringify({
                success: false,
                message: `Ruangan ini terdaftar pada permohonan penyewa "${t.tenant_name}". Status ketersediaan tidak dapat diubah.`,
              }),
              { status: 400 }
            );
          }

          // (2) jika masa berlaku belum selesai (end >= today) block
          if (end.isSameOrAfter(today)) {
            return new Response(
              JSON.stringify({
                success: false,
                message: `Ruangan sedang digunakan oleh "${
                  t.tenant_name
                }" sampai ${end.format(
                  "YYYY-MM-DD"
                )}. Status ketersediaan tidak dapat diubah.`,
              }),
              { status: 400 }
            );
          }
        }
      }
    }

    // Jika sampai sini valid → lakukan update (jika is_available tidak dikirim, gunakan nilai lama)
    const result = await pool.query(
      `UPDATE rooms 
         SET location_id = $1,
             room_number = $2,
             floor_id    = $3,
             room_length = $4,
             room_width  = $5,
             is_available= $6,
             price_per_m2= $7,
             updated_at = NOW()
       WHERE id = $8
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

    // ✅ Cek apakah ada tenant yang menggunakan room ini
    const checkTenant = await pool.query(
      `SELECT tenant_name 
         FROM tenant_application 
        WHERE room_id = $1`,
      [id]
    );

    if (checkTenant.rows.length > 0) {
      // Buat list tenant_name jadi string, contoh: "PT Maju Jaya, PT Sukses"
      const tenantList = checkTenant.rows.map((t) => t.tenant_name).join(", ");

      return new Response(
        JSON.stringify({
          success: false,
          message: `Ruangan ini tidak bisa dihapus, karena masih dipakai oleh penyewa: ${tenantList}`,
        }),
        { status: 200 }
      );
    }

    // ✅ Jika aman, hapus ruangan
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
