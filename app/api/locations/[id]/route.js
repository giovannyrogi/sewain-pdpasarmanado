import pool from "@/lib/dbConfig";

// UPDATE lokasi by id
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL
    const body = await request.json(); // data dari body
    const { location_name, city, address } = body;

    const result = await pool.query(
      `UPDATE locations SET location_name=$1, city=$2, address=$3 WHERE id=$4 RETURNING *`,
      [location_name, city, address, id]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengupdate lokasi",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error update location", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

// DELETE lokasi by id
export async function DELETE(request, context) {
  const { id } = await context.params;

  try {
    // Cek apakah ada room yang terkait dengan lokasi ini
    const checkRooms = await pool.query(
      `SELECT room_number FROM rooms WHERE location_id = $1`,
      [id]
    );

    if (checkRooms.rows.length > 0) {
      // Buat list room_number jadi string, contoh: "101, 102, 103"
      const roomList = checkRooms.rows.map((r) => r.room_number).join(", ");

      return new Response(
        JSON.stringify({
          success: false,
          message: `Lokasi tidak bisa dihapus, masih terdaftar dengan ruangan: ${roomList}`,
        }),
        { status: 400 }
      );
    }

    // Jika tidak ada room, lanjut hapus lokasi
    const result = await pool.query(
      `DELETE FROM locations WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Lokasi tidak ditemukan atau sudah dihapus.",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Berhasil menghapus lokasi." }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error delete location", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menghapus lokasi. Silakan coba lagi.",
        error: err.message,
      }),
      { status: 500 }
    );
  }
}
