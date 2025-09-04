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
    const result = await pool.query(
      `DELETE FROM locations WHERE id=$1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Lokasi tidak ditemukan atau gagal dihapus",
        }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({ success: true, message: "Berhasil menghapus lokasi" }),
      { status: 200 }
    );
  } catch (err) {
    console.log("error delete location", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
