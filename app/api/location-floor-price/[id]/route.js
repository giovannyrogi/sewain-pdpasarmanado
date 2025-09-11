import pool from "@/lib/dbConfig";

// UPDATE Rooms
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL
    const body = await request.json(); // data dari body
    const { location_id, floor, base_price } = body;

    // Lakukan update
    const result = await pool.query(
      `UPDATE location_floor_prices
       SET location_id=$1, floor=$2, base_price=$3, updated_at=NOW()
       WHERE id=$4
       RETURNING *`,
      [location_id, floor, base_price, id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Data tidak ditemukan" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengubah data Lantai",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.log("Error update Data", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

// DELETE Floor Price
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Cek apakah ada room yang terkait dengan floor_id ini
    const checkRooms = await pool.query(
      `SELECT room_number 
         FROM rooms 
        WHERE floor_id = $1`, // ganti location_id → floor_id
      [id]
    );

    if (checkRooms.rows.length > 0) {
      // Buat list room_number jadi string, contoh: "101, 102, 103"
      const roomList = checkRooms.rows.map((r) => r.room_number).join(", ");

      return new Response(
        JSON.stringify({
          success: false,
          message: `Lantai ini tidak bisa dihapus, karena masih terdaftar dengan ruangan: ${roomList}`,
        }),
        { status: 200 }
      );
    }

    // Jika aman, hapus data floor price
    const result = await pool.query(
      `DELETE FROM location_floor_prices
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Data Lantai tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil menghapus data Lantai",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error delete Data", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}

