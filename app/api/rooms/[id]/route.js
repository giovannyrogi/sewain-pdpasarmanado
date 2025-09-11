import pool from "@/lib/dbConfig";

// UPDATE Rooms
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL
    const body = await request.json(); // data dari body
    const {
      location_id,
      room_number,
      floor_id,
      room_length,
      room_width,
      is_available,
      price_per_m2,
    } = body;

    // Lakukan update
    const result = await pool.query(
      `UPDATE rooms SET location_id=$1, room_number=$2, floor_id=$3, room_length=$4, room_width=$5, is_available=$6, price_per_m2=$7 WHERE id=$8 RETURNING *`,
      [
        location_id,
        room_number,
        floor_id,
        room_length,
        room_width,
        is_available,
        price_per_m2,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Ruangan tidak ditemukan" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data Ruangan",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("Error update Ruangan", err);
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
